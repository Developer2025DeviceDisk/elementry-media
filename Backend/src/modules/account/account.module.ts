import { Module } from '@nestjs/common';
import { AccountController, AccountOperationsController, CustomerOrdersController, CustomerWishlistController } from './account.controller';
import { AccountService } from './account.service';
import { PasswordService } from '../auth/password.service';

@Module({ controllers: [AccountController, CustomerOrdersController, CustomerWishlistController, AccountOperationsController], providers: [AccountService, PasswordService] })
export class AccountModule {}
