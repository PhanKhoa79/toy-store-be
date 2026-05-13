import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminListProductsQueryDto } from '@/modules/products/dto/admin-list-products.query';
import { CreateProductDto } from '@/modules/products/dto/create-product.dto';
import { UpdateProductDto } from '@/modules/products/dto/update-product.dto';
import { ProductService } from '@/modules/products/services/product.service';

@ApiTags('admin-products')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Permissions({ module: 'admin-product-management', action: 'view' })
  @ApiOperation({ summary: 'List admin products with search, filters, sorting and pagination' })
  @ApiOkResponse({ description: 'Paginated admin product list' })
  @ApiStandardErrors()
  listAdminProducts(@Query() query: AdminListProductsQueryDto) {
    return this.productService.listAdminProducts(query);
  }

  @Post()
  @Permissions({ module: 'admin-product-management', action: 'create' })
  @ApiOperation({ summary: 'Create product' })
  @ApiCreatedResponse({ description: 'Created product' })
  @ApiStandardErrors()
  createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @Get(':id')
  @Permissions({ module: 'admin-product-management', action: 'view' })
  @ApiOperation({ summary: 'Get admin product detail by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Product detail' })
  @ApiStandardErrors()
  getAdminProductById(@Param('id') id: string) {
    return this.productService.getAdminProductById(id);
  }

  @Patch(':id')
  @Permissions({ module: 'admin-product-management', action: 'update' })
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated product' })
  @ApiStandardErrors()
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.updateProduct(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'admin-product-management', action: 'delete' })
  @ApiOperation({ summary: 'Disable product by setting status inactive' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Disabled product' })
  @ApiStandardErrors()
  disableProduct(@Param('id') id: string) {
    return this.productService.disableProduct(id);
  }
}
