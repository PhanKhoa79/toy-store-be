import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminListCategoriesQueryDto, CreateCategoryDto, UpdateCategoryDto } from '@/modules/categories/dto/category-admin.dto';
import { CategoryService } from '@/modules/categories/services/category.service';

@ApiTags('admin-categories')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Permissions({ module: 'category-brand-management', action: 'view' })
  @ApiOperation({ summary: 'List admin categories' })
  @ApiOkResponse({ description: 'Paginated category list' })
  @ApiStandardErrors()
  list(@Query() query: AdminListCategoriesQueryDto) {
    return this.categoryService.listAdminCategories(query);
  }

  @Post()
  @Permissions({ module: 'category-brand-management', action: 'create' })
  @ApiOperation({ summary: 'Create category' })
  @ApiCreatedResponse({ description: 'Created category' })
  @ApiStandardErrors()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(dto);
  }

  @Patch(':id')
  @Permissions({ module: 'category-brand-management', action: 'update' })
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated category' })
  @ApiStandardErrors()
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'category-brand-management', action: 'delete' })
  @ApiOperation({ summary: 'Disable category' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Disabled category' })
  @ApiStandardErrors()
  disable(@Param('id') id: string) {
    return this.categoryService.disableCategory(id);
  }
}
