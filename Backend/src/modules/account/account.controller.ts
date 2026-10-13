import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthenticatedUser, CurrentUser, Roles } from '../../common/security/access';
import { Role } from '../../infrastructure/mongodb/models';
import { Environment } from '../../config/environment';
import { AccountService } from './account.service';
import { AccountQuery, AddressDto, ChangePasswordDto, PreferencesDto, ProfileDto, ReturnDto, ReturnReviewDto, TrackingDto, UpiDto, VerifyPasswordDto, WishlistDto } from './account.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService, private readonly config: ConfigService<Environment, true>) {}
  @Get() dashboard(@CurrentUser() user: AuthenticatedUser) { return this.account.dashboard(user.id); }
  @Get('profile') profile(@CurrentUser() user: AuthenticatedUser) { return this.account.profile(user.id); }
  @Patch('profile') updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: ProfileDto) { return this.account.updateProfile(user.id, dto); }
  @Get('addresses') addresses(@CurrentUser() user: AuthenticatedUser) { return this.account.addresses(user.id); }
  @Post('addresses') saveAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddressDto) { return this.account.saveAddress(user.id, dto); }
  @Patch('addresses/:id') updateAddress(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AddressDto) { return this.account.saveAddress(user.id, dto, id); }
  @Delete('addresses/:id') removeAddress(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) { return this.account.removeAddress(user.id, id); }
  @Post('addresses/:id/default') defaultAddress(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) { return this.account.defaultAddress(user.id, id); }
  @Get('payment-methods') methods(@CurrentUser() user: AuthenticatedUser) { return this.account.paymentMethods(user.id); }
  @Post('payment-methods') saveMethod(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpiDto) { return this.account.saveUpi(user.id, dto); }
  @Patch('payment-methods/:id') updateMethod(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpiDto) { return this.account.saveUpi(user.id, dto, id); }
  @Delete('payment-methods/:id') removeMethod(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) { return this.account.removeUpi(user.id, id); }
  @Post('payment-methods/:id/default') defaultMethod(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) { return this.account.defaultUpi(user.id, id); }
  @Get('settings') settings(@CurrentUser() user: AuthenticatedUser) { return this.account.preferences(user.id); }
  @Patch('settings') updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: PreferencesDto) { return this.account.updatePreferences(user.id, dto); }
  @Get('returns') returns(@CurrentUser() user: AuthenticatedUser, @Query() query: AccountQuery) { return this.account.returns(user.id, query); }
  @Post('password') @HttpCode(204)
  async password(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.account.revokeSessions(user.id, dto.currentPassword, dto.newPassword);
    await this.endSession(request, response);
  }
  @Post('sessions/revoke') @HttpCode(204)
  async sessions(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyPasswordDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.account.revokeSessions(user.id, dto.currentPassword);
    await this.endSession(request, response);
  }
  private async endSession(request: Request, response: Response) {
    await new Promise<void>((resolve, reject) => request.session.destroy(error => error ? reject(error) : resolve()));
    const production = this.config.get('NODE_ENV') === 'production';
    response.clearCookie(production ? '__Host-sid' : 'sid', { path: '/', httpOnly: true, secure: production, sameSite: this.config.get('COOKIE_SAME_SITE', { infer: true }) });
  }
}

@Controller(['account/orders', 'orders'])
export class CustomerOrdersController {
  constructor(private readonly account: AccountService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser, @Query() query: AccountQuery) { return this.account.orders(user.id, query); }
  @Get(':id') detail(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) { return this.account.order(user.id, id); }
  @Post(':id/cancel') @HttpCode(200) cancel(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) { return this.account.cancelOrder(user.id, id); }
  @Post(':id/returns') createReturn(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ReturnDto) { return this.account.requestReturn(user.id, id, dto.reason); }
}
@Controller(['account/wishlist', 'wishlist'])
export class CustomerWishlistController {
  constructor(private readonly account: AccountService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser) { return this.account.wishlist(user.id); }
  @Post('items') @HttpCode(204) add(@CurrentUser() user: AuthenticatedUser, @Body() dto: WishlistDto) { return this.account.addWishlist(user.id, dto.productId); }
  @Delete('items/:id') @HttpCode(204) remove(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) { return this.account.removeWishlist(user.id, id); }
}
@Roles(Role.ADMIN)
@Controller('admin/account')
export class AccountOperationsController {
  constructor(private readonly account: AccountService) {}
  @Post('orders/:id/tracking') @HttpCode(204) tracking(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: TrackingDto) { return this.account.updateTracking(id, dto); }
  @Patch('returns/:id') review(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ReturnReviewDto) { return this.account.reviewReturn(id, dto); }
}
