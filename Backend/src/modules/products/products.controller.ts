import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../../common/security/access';
import { ProductQuery } from './products.dto';
import { ProductsService } from './products.service';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() list(@Query() query: ProductQuery) { return this.products.list(query); }
  @Get(':id') detail(@Param('id', new ParseUUIDPipe()) id: string) { return this.products.detail(id); }
}
