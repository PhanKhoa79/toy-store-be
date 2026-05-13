import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import { AdminListHomepageSlidesQueryDto, CreateHomepageSlideDto, UpdateHomepageSlideDto } from '@/modules/homepage-slides/dto/homepage-slide-admin.dto';
import { HomepageSlideRepository } from '@/modules/homepage-slides/repositories/homepage-slide.repository';

@Injectable()
export class HomepageSlideService {
  constructor(private readonly homepageSlideRepository: HomepageSlideRepository) {}

  listPublicSlides() {
    return this.homepageSlideRepository.findActiveMany();
  }

  async listAdminSlides(query: AdminListHomepageSlidesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.HomepageSlideWhereInput = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    const orderBy: Prisma.HomepageSlideOrderByWithRelationInput = { [query.sortBy ?? 'displayOrder']: query.sortDirection ?? 'asc' };
    const [total, slides] = await Promise.all([this.homepageSlideRepository.count(where), this.homepageSlideRepository.findMany(where, page, pageSize, orderBy)]);
    return { data: slides, meta: createPaginationMeta(page, pageSize, total) };
  }

  async getAdminSlideById(id: string) {
    const slide = await this.homepageSlideRepository.findById(id);
    if (!slide) throw new ApiException('SLIDE_NOT_FOUND', 'Không tìm thấy slide.', HttpStatus.NOT_FOUND);
    return slide;
  }

  createSlide(dto: CreateHomepageSlideDto) {
    return this.homepageSlideRepository.create(dto);
  }

  async updateSlide(id: string, dto: UpdateHomepageSlideDto) {
    await this.getAdminSlideById(id);
    return this.homepageSlideRepository.update(id, dto);
  }

  async disableSlide(id: string) {
    await this.getAdminSlideById(id);
    return this.homepageSlideRepository.disable(id);
  }
}
