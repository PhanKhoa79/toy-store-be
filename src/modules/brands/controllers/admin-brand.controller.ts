import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminListBrandsQueryDto, CreateBrandDto, UpdateBrandDto } from '@/modules/brands/dto/brand-admin.dto';
import { BrandService } from '@/modules/brands/services/brand.service';

@ApiTags('admin-brands')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/brands')
export class AdminBrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @Permissions({ module: 'category-brand-management', action: 'view' })
  @ApiOperation({ summary: 'List admin brands' })
  @ApiOkResponse({ description: 'Paginated brand list' })
  @ApiStandardErrors()
  list(@Query() query: AdminListBrandsQueryDto) {
    return this.brandService.listAdminBrands(query);
  }

  @Post()
  @Permissions({ module: 'category-brand-management', action: 'create' })
  @ApiOperation({ summary: 'Create brand' })
  @ApiCreatedResponse({ description: 'Created brand' })
  @ApiStandardErrors()
  create(@Body() dto: CreateBrandDto) {
    return this.brandService.createBrand(dto);
  }

  @Patch(':id')
  @Permissions({ module: 'category-brand-management', action: 'update' })
  @ApiOperation({ summary: 'Update brand' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated brand' })
  @ApiStandardErrors()
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandService.updateBrand(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'category-brand-management', action: 'delete' })
  @ApiOperation({ summary: 'Disable brand' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Disabled brand' })
  @ApiStandardErrors()
  disable(@Param('id') id: string) {
    return this.brandService.disableBrand(id);
  }
}
