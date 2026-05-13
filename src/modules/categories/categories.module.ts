import { Module } from '@nestjs/common';
import { AdminCategoryController } from '@/modules/categories/controllers/admin-category.controller';
import { CategoryController } from '@/modules/categories/controllers/category.controller';
import { CategoryRepository } from '@/modules/categories/repositories/category.repository';
import { CategoryService } from '@/modules/categories/services/category.service';

@Module({
  controllers: [CategoryController, AdminCategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository]
})
export class CategoriesModule {}
