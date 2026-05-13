import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.count({ where });
  }

  findMany(where: Prisma.CategoryWhereInput, page: number, pageSize: number, orderBy: Prisma.CategoryOrderByWithRelationInput) {
    return this.prisma.category.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize });
  }

  findActiveMany() {
    return this.prisma.category.findMany({ where: { status: 'active' }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] });
  }

  findActiveBySlug(slug: string) {
    return this.prisma.category.findFirst({ where: { slug, status: 'active' } });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  disable(id: string) {
    return this.prisma.category.update({ where: { id }, data: { status: 'inactive' } });
  }
}
