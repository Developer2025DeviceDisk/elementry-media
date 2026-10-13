import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { trackingStatuses } from './account.models';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class ProfileDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @Transform(trim) @IsString() @MaxLength(20) @Matches(/^(?:\+?[0-9][0-9 ()-]{6,19})?$/) phone!: string;
}
export class AddressDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(30) label!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @Transform(trim) @IsString() @MaxLength(20) @Matches(/^\+?[0-9][0-9 ()-]{6,19}$/) phone!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(200) line1!: string;
  @Transform(trim) @IsString() @MaxLength(200) line2!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) city!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) state!: string;
  @Transform(trim) @IsString() @MinLength(3) @MaxLength(12) @Matches(/^[A-Za-z0-9 -]+$/) postalCode!: string;
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @IsString() @Matches(/^[A-Z]{2}$/) country!: string;
}
export class UpiDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(40) label!: string;
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString() @Matches(/^[a-z0-9][a-z0-9._-]{1,99}@[a-z][a-z0-9.-]{1,49}$/) upiId!: string;
}
export class PreferencesDto {
  @IsBoolean() orderUpdates!: boolean;
  @IsBoolean() marketingEmails!: boolean;
}
export class VerifyPasswordDto {
  @IsString() @MinLength(12) @MaxLength(128) currentPassword!: string;
}
export class ChangePasswordDto extends VerifyPasswordDto {
  @IsString() @MinLength(12) @MaxLength(128) newPassword!: string;
}
export class AccountQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(1000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 10;
}
export class WishlistDto { @IsUUID() productId!: string }
export class ReturnDto {
  @Transform(trim) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}
export class TrackingDto {
  @IsIn(trackingStatuses) status!: typeof trackingStatuses[number];
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) carrier?: string;
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) trackingNumber?: string;
  @Transform(trim) @IsString() @MinLength(3) @MaxLength(300) note!: string;
}
export class ReturnReviewDto {
  @IsIn(['APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_PENDING', 'REFUNDED']) status!: string;
  @Transform(trim) @IsString() @MinLength(3) @MaxLength(500) note!: string;
  // A refund is recorded only with an external reconciliation reference.
  @IsOptional() @Transform(trim) @IsString() @MinLength(3) @MaxLength(128) refundReference?: string;
}
