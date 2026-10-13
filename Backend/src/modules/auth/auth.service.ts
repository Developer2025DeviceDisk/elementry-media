import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MongoDbService } from '../../infrastructure/mongodb/mongodb.service';
import { Role, UserDocument } from '../../infrastructure/mongodb/models';
import { PasswordService } from './password.service';
import { LoginDto, RegisterDto } from './auth.dto';

const publicUser = (user: UserDocument) => ({ id: user._id, email: user.email, name: user.name, role: user.role, sessionVersion: user.sessionVersion ?? 0 });

@Injectable()
export class AuthService {
  constructor(private readonly mongo: MongoDbService, private readonly passwords: PasswordService) {}
  async register(dto: RegisterDto) {
    const passwordHash = await this.passwords.hash(dto.password);
    const now = new Date();
    const user: UserDocument = {
      _id: randomUUID(), email: dto.email.trim().toLowerCase(), name: dto.name.trim(), passwordHash,
      role: Role.CUSTOMER, disabledAt: null, createdAt: now, updatedAt: now,
    };
    await this.mongo.users.insertOne(user);
    return publicUser(user);
  }
  async login(dto: LoginDto) {
    const user = await this.mongo.users.findOne({ email: dto.email.trim().toLowerCase() });
    const valid = user ? await this.passwords.verify(dto.password, user.passwordHash) : (await this.passwords.dummyVerify(dto.password), false);
    if (!user || !valid || user.disabledAt) throw new UnauthorizedException('Invalid email or password');
    return publicUser(user);
  }
}
