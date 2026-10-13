import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ClientSession } from 'mongodb';
import { MongoDbService } from '../../infrastructure/mongodb/mongodb.service';
import { OrderDocument, OrderItemDocument, OrderStatus } from '../../infrastructure/mongodb/models';
import { serializeMoney } from '../../infrastructure/mongodb/money';
import { PasswordService } from '../auth/password.service';
import { AccountQuery, AddressDto, ChangePasswordDto, PreferencesDto, ProfileDto, ReturnReviewDto, TrackingDto, UpiDto } from './account.dto';
import { CustomerAccountDocument, OrderTrackingDocument, ReturnDocument, trackingStatuses } from './account.models';

export function emptyAccount(id: string): CustomerAccountDocument {
  const now = new Date();
  return { _id: id, phone: null, addresses: [], defaultAddressId: null, paymentMethods: [], defaultPaymentMethodId: null,
    wishlistProductIds: [], preferences: { orderUpdates: true, marketingEmails: false }, createdAt: now, updatedAt: now };
}
function returnView(record: ReturnDocument) {
  return { id: record._id, orderId: record.orderId, reason: record.reason, status: record.status, reviewNote: record.reviewNote,
    refundAmount: record.refundAmount ? serializeMoney(record.refundAmount) : null, refundReference: record.refundReference,
    currency: record.currency, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() };
}
function orderView(order: OrderDocument, items: OrderItemDocument[], tracking: OrderTrackingDocument | null, returned: ReturnDocument | null) {
  return { id: order._id, status: order.status, total: serializeMoney(order.total), currency: order.currency,
    createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(),
    items: items.map(item => ({ id: item._id, productId: item.productId, name: item.name, sku: item.sku, quantity: item.quantity, unitPrice: serializeMoney(item.unitPrice) })),
    tracking: tracking ? { status: tracking.status, carrier: tracking.carrier, trackingNumber: tracking.trackingNumber,
      events: tracking.events.map(event => ({ ...event, occurredAt: event.occurredAt.toISOString() })) } : null,
    returnRequest: returned ? returnView(returned) : null,
    canCancel: order.status === OrderStatus.PENDING && (!tracking || ['PROCESSING', 'PACKED'].includes(tracking.status)),
    canReturn: order.status === OrderStatus.FULFILLED && (!tracking || tracking.status === 'DELIVERED') && !returned,
  };
}

@Injectable()
export class AccountService {
  constructor(private readonly mongo: MongoDbService, private readonly passwords: PasswordService) {}
  private async account(userId: string) { return await this.mongo.accounts.findOne({ _id: userId }) ?? emptyAccount(userId); }
  private async ownedOrder(userId: string, id: string, session?: ClientSession) {
    const order = await this.mongo.orders.findOne({ _id: id, userId }, { session });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
  private async mutateAccount<T>(userId: string, mutate: (account: CustomerAccountDocument, session: ClientSession) => Promise<T> | T): Promise<T> {
    await this.mongo.accounts.updateOne({ _id: userId }, { $setOnInsert: emptyAccount(userId) }, { upsert: true });
    const session = this.mongo.client.startSession();
    try {
      return (await session.withTransaction(async () => {
        const account = (await this.mongo.accounts.findOne({ _id: userId }, { session }))!;
        const result = await mutate(account, session);
        account.updatedAt = new Date();
        const { _id, ...fields } = account;
        await this.mongo.accounts.updateOne({ _id }, { $set: fields }, { session });
        return result;
      }))!;
    } finally { await session.endSession(); }
  }
  async profile(userId: string) {
    const [user, account] = await Promise.all([this.mongo.users.findOne({ _id: userId }, { projection: { passwordHash: 0 } }), this.account(userId)]);
    if (!user) throw new NotFoundException('Account not found');
    return { id: user._id, name: user.name, email: user.email, phone: account.phone, createdAt: user.createdAt.toISOString() };
  }
  async updateProfile(userId: string, dto: ProfileDto) {
    await this.mutateAccount(userId, async (account, session) => {
      account.phone = dto.phone || null;
      await this.mongo.users.updateOne({ _id: userId }, { $set: { name: dto.name, updatedAt: new Date() } }, { session });
    });
    return this.profile(userId);
  }
  async dashboard(userId: string) {
    const [profile, account, orders, totalOrders, openReturns] = await Promise.all([
      this.profile(userId), this.account(userId), this.orders(userId, { page: 1, limit: 5 }),
      this.mongo.orders.countDocuments({ userId }), this.mongo.returns.countDocuments({ userId, status: { $nin: ['REJECTED', 'REFUNDED'] } }),
    ]);
    return { profile, counts: { orders: totalOrders, wishlist: account.wishlistProductIds.length, addresses: account.addresses.length, paymentMethods: account.paymentMethods.length, openReturns }, recentOrders: orders.data };
  }
  async addresses(userId: string) { const account = await this.account(userId); return { data: account.addresses, defaultId: account.defaultAddressId }; }
  async saveAddress(userId: string, dto: AddressDto, id?: string) {
    await this.mutateAccount(userId, account => {
      if (id) {
        const index = account.addresses.findIndex(address => address.id === id);
        if (index < 0) throw new NotFoundException('Address not found');
        account.addresses[index] = { ...dto, id };
      } else {
        if (account.addresses.length >= 20) throw new ConflictException('You can save up to 20 addresses');
        const address = { ...dto, id: randomUUID() };
        account.addresses.push(address);
        account.defaultAddressId ??= address.id;
      }
    });
    return this.addresses(userId);
  }
  async removeAddress(userId: string, id: string) {
    await this.mutateAccount(userId, account => {
      if (!account.addresses.some(address => address.id === id)) throw new NotFoundException('Address not found');
      account.addresses = account.addresses.filter(address => address.id !== id);
      if (account.defaultAddressId === id) account.defaultAddressId = account.addresses[0]?.id ?? null;
    });
    return this.addresses(userId);
  }
  async defaultAddress(userId: string, id: string) {
    await this.mutateAccount(userId, account => {
      if (!account.addresses.some(address => address.id === id)) throw new NotFoundException('Address not found');
      account.defaultAddressId = id;
    });
    return this.addresses(userId);
  }
  async paymentMethods(userId: string) { const account = await this.account(userId); return { data: account.paymentMethods, defaultId: account.defaultPaymentMethodId, type: 'UPI' as const }; }
  async saveUpi(userId: string, dto: UpiDto, id?: string) {
    await this.mutateAccount(userId, account => {
      if (account.paymentMethods.some(method => method.upiId === dto.upiId && method.id !== id)) throw new ConflictException('This UPI ID is already saved');
      if (id) {
        const index = account.paymentMethods.findIndex(method => method.id === id);
        if (index < 0) throw new NotFoundException('Payment method not found');
        account.paymentMethods[index] = { ...dto, id };
      } else {
        if (account.paymentMethods.length >= 10) throw new ConflictException('You can save up to 10 payment methods');
        const method = { ...dto, id: randomUUID() };
        account.paymentMethods.push(method);
        account.defaultPaymentMethodId ??= method.id;
      }
    });
    return this.paymentMethods(userId);
  }
  async removeUpi(userId: string, id: string) {
    await this.mutateAccount(userId, account => {
      if (!account.paymentMethods.some(method => method.id === id)) throw new NotFoundException('Payment method not found');
      account.paymentMethods = account.paymentMethods.filter(method => method.id !== id);
      if (account.defaultPaymentMethodId === id) account.defaultPaymentMethodId = account.paymentMethods[0]?.id ?? null;
    });
    return this.paymentMethods(userId);
  }
  async defaultUpi(userId: string, id: string) {
    await this.mutateAccount(userId, account => {
      if (!account.paymentMethods.some(method => method.id === id)) throw new NotFoundException('Payment method not found');
      account.defaultPaymentMethodId = id;
    });
    return this.paymentMethods(userId);
  }
  async wishlist(userId: string) {
    const account = await this.account(userId);
    const products = await this.mongo.products.find({ _id: { $in: account.wishlistProductIds } }).toArray();
    return account.wishlistProductIds.flatMap(id => {
      const product = products.find(product => product._id === id);
      if (!product) return [];
      return [{ id: product._id, sku: product.sku, name: product.name, description: product.description, price: serializeMoney(product.price), currency: product.currency,
        stock: product.stock, active: product.active, createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() }];
    });
  }
  async addWishlist(userId: string, productId: string) {
    if (!await this.mongo.products.findOne({ _id: productId, active: true })) throw new NotFoundException('Product not found');
    await this.mutateAccount(userId, account => {
      if (!account.wishlistProductIds.includes(productId)) {
        if (account.wishlistProductIds.length >= 200) throw new ConflictException('Your wishlist can contain up to 200 products');
        account.wishlistProductIds.unshift(productId);
      }
    });
  }
  async removeWishlist(userId: string, productId: string) {
    await this.mutateAccount(userId, account => { account.wishlistProductIds = account.wishlistProductIds.filter(id => id !== productId); });
  }
  async preferences(userId: string) { return (await this.account(userId)).preferences; }
  async updatePreferences(userId: string, dto: PreferencesDto) {
    await this.mutateAccount(userId, account => { account.preferences = dto; });
    return this.preferences(userId);
  }
  async revokeSessions(userId: string, password: string, newPassword?: string) {
    const user = await this.mongo.users.findOne({ _id: userId });
    if (!user) throw new UnauthorizedException('Authentication required');
    if (!await this.passwords.verify(password, user.passwordHash)) throw new BadRequestException('Current password is incorrect');
    if (newPassword === password) throw new BadRequestException('Choose a different new password');
    const passwordHash = newPassword ? await this.passwords.hash(newPassword) : user.passwordHash;
    const result = await this.mongo.users.updateOne({ _id: userId, passwordHash: user.passwordHash, sessionVersion: user.sessionVersion ?? { $exists: false } }, {
      $set: { passwordHash, updatedAt: new Date() }, $inc: { sessionVersion: 1 },
    });
    if (!result.matchedCount) throw new ConflictException('Account security changed; sign in again');
  }
  async orders(userId: string, query: AccountQuery) {
    const [orders, total] = await Promise.all([this.mongo.orders.find({ userId }).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).toArray(), this.mongo.orders.countDocuments({ userId })]);
    const ids = orders.map(order => order._id);
    const [items, tracking, returns] = await Promise.all([
      this.mongo.orderItems.find({ orderId: { $in: ids } }).toArray(), this.mongo.tracking.find({ _id: { $in: ids }, userId }).toArray(), this.mongo.returns.find({ orderId: { $in: ids }, userId }).toArray(),
    ]);
    return { data: orders.map(order => orderView(order, items.filter(item => item.orderId === order._id), tracking.find(record => record._id === order._id) ?? null, returns.find(record => record.orderId === order._id) ?? null)), total, page: query.page, limit: query.limit };
  }
  async order(userId: string, id: string) {
    const order = await this.ownedOrder(userId, id);
    const [items, tracking, returned] = await Promise.all([
      this.mongo.orderItems.find({ orderId: id }).toArray(), this.mongo.tracking.findOne({ _id: id, userId }), this.mongo.returns.findOne({ orderId: id, userId }),
    ]);
    return orderView(order, items, tracking, returned);
  }
  async cancelOrder(userId: string, id: string) {
    const order = await this.order(userId, id);
    if (order.status === OrderStatus.CANCELLED) return order;
    if (!order.canCancel) throw new ConflictException('This order can no longer be cancelled');
    if (!(await this.mongo.orders.updateOne({ _id: id, userId, status: OrderStatus.PENDING }, { $set: { status: OrderStatus.CANCELLED, updatedAt: new Date() } })).matchedCount) throw new ConflictException('Order status changed; refresh and try again');
    return this.order(userId, id);
  }
  async requestReturn(userId: string, orderId: string, reason: string) {
    const order = await this.order(userId, orderId);
    if (order.returnRequest) throw new ConflictException('A return has already been requested for this order');
    if (!order.canReturn) throw new ConflictException('Returns can be requested after order fulfillment');
    const now = new Date();
    const record: ReturnDocument = { _id: randomUUID(), userId, orderId, reason, status: 'REQUESTED', reviewNote: null, refundAmount: null, refundReference: null, currency: order.currency, createdAt: now, updatedAt: now };
    await this.mongo.returns.insertOne(record);
    return returnView(record);
  }
  async returns(userId: string, query: AccountQuery) {
    const [records, total] = await Promise.all([this.mongo.returns.find({ userId }).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).toArray(), this.mongo.returns.countDocuments({ userId })]);
    return { data: records.map(returnView), total, page: query.page, limit: query.limit };
  }
  async updateTracking(orderId: string, dto: TrackingDto) {
    const session = this.mongo.client.startSession();
    try { await session.withTransaction(async () => {
      const order = await this.mongo.orders.findOne({ _id: orderId }, { session });
      if (!order) throw new NotFoundException('Order not found');
      if (![OrderStatus.PAID, OrderStatus.FULFILLED].includes(order.status)) throw new ConflictException('Only paid or fulfilled orders can be shipped');
      const previous = await this.mongo.tracking.findOne({ _id: orderId }, { session });
      if (previous && trackingStatuses.indexOf(dto.status) < trackingStatuses.indexOf(previous.status)) throw new ConflictException('Tracking cannot move backwards');
      if ((previous?.events.length ?? 0) >= 100) throw new ConflictException('Tracking history limit reached');
      const now = new Date();
      const tracking: OrderTrackingDocument = { _id: orderId, userId: order.userId, status: dto.status,
        carrier: dto.carrier ?? previous?.carrier ?? null, trackingNumber: dto.trackingNumber ?? previous?.trackingNumber ?? null,
        events: [...(previous?.events ?? []), { id: randomUUID(), status: dto.status, note: dto.note, occurredAt: now }], updatedAt: now };
      if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(dto.status) && (!tracking.carrier || !tracking.trackingNumber)) throw new BadRequestException('Shipping requires carrier and tracking number');
      await this.mongo.tracking.replaceOne({ _id: orderId }, tracking, { session, upsert: true });
      if (dto.status === 'DELIVERED') await this.mongo.orders.updateOne({ _id: orderId }, { $set: { status: OrderStatus.FULFILLED, updatedAt: now } }, { session });
    }); } finally { await session.endSession(); }
  }
  async reviewReturn(id: string, dto: ReturnReviewDto) {
    const record = await this.mongo.returns.findOne({ _id: id });
    if (!record) throw new NotFoundException('Return not found');
    const transitions: Record<string, string[]> = { REQUESTED: ['APPROVED', 'REJECTED'], APPROVED: ['RECEIVED'], RECEIVED: ['REFUND_PENDING'], REFUND_PENDING: ['REFUNDED'] };
    if (!transitions[record.status]?.includes(dto.status)) throw new ConflictException('Invalid return status transition');
    const order = await this.ownedOrder(record.userId, record.orderId);
    if (dto.status === 'REFUNDED' && !dto.refundReference) throw new BadRequestException('Record the completed external refund reference');
    const result = await this.mongo.returns.updateOne({ _id: id, status: record.status }, { $set: {
      status: dto.status as ReturnDocument['status'], reviewNote: dto.note, updatedAt: new Date(),
      refundAmount: ['REFUND_PENDING', 'REFUNDED'].includes(dto.status) ? order.total : null,
      refundReference: dto.status === 'REFUNDED' ? dto.refundReference! : null,
    } });
    if (!result.matchedCount) throw new ConflictException('Return status changed; refresh and try again');
    return returnView((await this.mongo.returns.findOne({ _id: id }))!);
  }
}
