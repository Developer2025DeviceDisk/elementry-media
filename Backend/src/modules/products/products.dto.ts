import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ProductQuery {
  @IsOptional() @IsString() @MaxLength(100)
  q?: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  page = 1;

  @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 20;
}
