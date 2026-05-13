import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

const productInclude = {
  brand: true,
  category: true
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.ProductWhereInput) {
    return this.prisma.product.count({ where });
  }

  findMany(where: Prisma.ProductWhereInput, page: number, pageSize: number, orderBy: Prisma.ProductOrderByWithRelationInput) {
    return this.prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });
  }

  findActiveBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug, status: 'active' },
      include: productInclude
    });
  }
}
