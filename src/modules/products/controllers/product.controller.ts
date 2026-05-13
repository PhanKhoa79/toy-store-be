import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ListProductsQueryDto } from '@/modules/products/dto/list-products.query';
import { ProductService } from '@/modules/products/services/product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List active public products with search, filters and pagination' })
  @ApiOkResponse({ description: 'Paginated active product list' })
  listProducts(@Query() query: ListProductsQueryDto) {
    return this.productService.listProducts(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get active public product detail by slug' })
  @ApiParam({ name: 'slug', example: 'bo-xep-hinh-cau-vong' })
  @ApiOkResponse({ description: 'Product detail' })
  getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }
}
