import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.BrandWhereInput) {
    return this.prisma.brand.count({ where });
  }

  findMany(where: Prisma.BrandWhereInput, page: number, pageSize: number, orderBy: Prisma.BrandOrderByWithRelationInput) {
    return this.prisma.brand.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize });
  }

  findActiveMany() {
    return this.prisma.brand.findMany({ where: { status: 'active' }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] });
  }

  findActiveBySlug(slug: string) {
    return this.prisma.brand.findFirst({ where: { slug, status: 'active' } });
  }

  findBySlug(slug: string) {
    return this.prisma.brand.findUnique({ where: { slug } });
  }

  findById(id: string) {
    return this.prisma.brand.findUnique({ where: { id } });
  }

  create(data: Prisma.BrandCreateInput) {
    return this.prisma.brand.create({ data });
  }

  update(id: string, data: Prisma.BrandUpdateInput) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  disable(id: string) {
    return this.prisma.brand.update({ where: { id }, data: { status: 'inactive' } });
  }
}
