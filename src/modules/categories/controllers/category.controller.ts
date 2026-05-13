import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { CategoryService } from '@/modules/categories/services/category.service';

@Public()
@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List active public categories' })
  @ApiOkResponse({ description: 'Active category list' })
  listPublicCategories() {
    return this.categoryService.listPublicCategories();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get active public category by slug' })
  @ApiParam({ name: 'slug', example: 'do-choi-giao-duc' })
  @ApiOkResponse({ description: 'Category detail' })
  getPublicCategoryBySlug(@Param('slug') slug: string) {
    return this.categoryService.getPublicCategoryBySlug(slug);
  }
}
