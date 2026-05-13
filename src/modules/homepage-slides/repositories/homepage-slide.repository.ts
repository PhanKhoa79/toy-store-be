import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class HomepageSlideRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.HomepageSlideWhereInput) {
    return this.prisma.homepageSlide.count({ where });
  }

  findMany(where: Prisma.HomepageSlideWhereInput, page: number, pageSize: number, orderBy: Prisma.HomepageSlideOrderByWithRelationInput) {
    return this.prisma.homepageSlide.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize });
  }

  findActiveMany() {
    return this.prisma.homepageSlide.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] });
  }

  findById(id: string) {
    return this.prisma.homepageSlide.findUnique({ where: { id } });
  }

  create(data: Prisma.HomepageSlideCreateInput) {
    return this.prisma.homepageSlide.create({ data });
  }

  update(id: string, data: Prisma.HomepageSlideUpdateInput) {
    return this.prisma.homepageSlide.update({ where: { id }, data });
  }

  disable(id: string) {
    return this.prisma.homepageSlide.update({ where: { id }, data: { isActive: false } });
  }
}
