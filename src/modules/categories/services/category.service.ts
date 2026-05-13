import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import { AdminListCategoriesQueryDto, CreateCategoryDto, UpdateCategoryDto } from '@/modules/categories/dto/category-admin.dto';
import { CategoryRepository } from '@/modules/categories/repositories/category.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  listPublicCategories() {
    return this.categoryRepository.findActiveMany();
  }

  async getPublicCategoryBySlug(slug: string) {
    const category = await this.categoryRepository.findActiveBySlug(slug);
    if (!category) throw new ApiException('CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.', HttpStatus.NOT_FOUND);
    return category;
  }

  async listAdminCategories(query: AdminListCategoriesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.CategoryWhereInput = {};
    if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }];
    if (query.status) where.status = query.status;
    const orderBy: Prisma.CategoryOrderByWithRelationInput = { [query.sortBy ?? 'displayOrder']: query.sortDirection ?? 'asc' };
    const [total, categories] = await Promise.all([this.categoryRepository.count(where), this.categoryRepository.findMany(where, page, pageSize, orderBy)]);
    return { data: categories, meta: createPaginationMeta(page, pageSize, total) };
  }

  async createCategory(dto: CreateCategoryDto) {
    await this.validateUniqueSlug(dto.slug);
    return this.categoryRepository.create({ ...dto, displayOrder: dto.displayOrder ?? 0 });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) throw new ApiException('CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.', HttpStatus.NOT_FOUND);
    if (dto.slug) await this.validateUniqueSlug(dto.slug, id);
    return this.categoryRepository.update(id, { ...dto });
  }

  async disableCategory(id: string) {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) throw new ApiException('CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.', HttpStatus.NOT_FOUND);
    return this.categoryRepository.disable(id);
  }

  private async validateUniqueSlug(slug: string, excludedId?: string) {
    const existing = await this.categoryRepository.findBySlug(slug);
    if (existing && existing.id !== excludedId) throw new ApiException('CATEGORY_SLUG_ALREADY_EXISTS', 'Slug danh mục đã tồn tại.', HttpStatus.CONFLICT);
  }
}
