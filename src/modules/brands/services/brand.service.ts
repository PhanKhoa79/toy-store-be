import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import { AdminListBrandsQueryDto, CreateBrandDto, UpdateBrandDto } from '@/modules/brands/dto/brand-admin.dto';
import { BrandRepository } from '@/modules/brands/repositories/brand.repository';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  listPublicBrands() {
    return this.brandRepository.findActiveMany();
  }

  async getPublicBrandBySlug(slug: string) {
    const brand = await this.brandRepository.findActiveBySlug(slug);
    if (!brand) throw new ApiException('BRAND_NOT_FOUND', 'Không tìm thấy thương hiệu.', HttpStatus.NOT_FOUND);
    return brand;
  }

  async listAdminBrands(query: AdminListBrandsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.BrandWhereInput = {};
    if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }];
    if (query.status) where.status = query.status;
    const orderBy: Prisma.BrandOrderByWithRelationInput = { [query.sortBy ?? 'displayOrder']: query.sortDirection ?? 'asc' };
    const [total, brands] = await Promise.all([this.brandRepository.count(where), this.brandRepository.findMany(where, page, pageSize, orderBy)]);
    return { data: brands, meta: createPaginationMeta(page, pageSize, total) };
  }

  async createBrand(dto: CreateBrandDto) {
    await this.validateUniqueSlug(dto.slug);
    return this.brandRepository.create({ ...dto, displayOrder: dto.displayOrder ?? 0 });
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const existing = await this.brandRepository.findById(id);
    if (!existing) throw new ApiException('BRAND_NOT_FOUND', 'Không tìm thấy thương hiệu.', HttpStatus.NOT_FOUND);
    if (dto.slug) await this.validateUniqueSlug(dto.slug, id);
    return this.brandRepository.update(id, { ...dto });
  }

  async disableBrand(id: string) {
    const existing = await this.brandRepository.findById(id);
    if (!existing) throw new ApiException('BRAND_NOT_FOUND', 'Không tìm thấy thương hiệu.', HttpStatus.NOT_FOUND);
    return this.brandRepository.disable(id);
  }

  private async validateUniqueSlug(slug: string, excludedId?: string) {
    const existing = await this.brandRepository.findBySlug(slug);
    if (existing && existing.id !== excludedId) throw new ApiException('BRAND_SLUG_ALREADY_EXISTS', 'Slug thương hiệu đã tồn tại.', HttpStatus.CONFLICT);
  }
}
