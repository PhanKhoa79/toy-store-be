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
    return this.prisma.product.findFirst({ where: { slug, status: 'active' }, include: productInclude });
  }

  findById(id: string) {
    return this.prisma.product.findUnique({ where: { id }, include: productInclude });
  }

  findBySlug(slug: string) {
    return this.prisma.product.findUnique({ where: { slug } });
  }

  findBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  findCategoryById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findBrandById(id: string) {
    return this.prisma.brand.findUnique({ where: { id } });
  }

  async create(data: Prisma.ProductCreateInput, images?: { imageUrl: string; altText?: string; displayOrder?: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data, include: productInclude });
      if (images?.length) {
        await tx.productImage.createMany({
          data: images.map((image) => ({
            productId: product.id,
            imageUrl: image.imageUrl,
            altText: image.altText,
            displayOrder: image.displayOrder ?? 0
          }))
        });
      }
      return product;
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput, images?: { imageUrl: string; altText?: string; displayOrder?: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length) {
          await tx.productImage.createMany({
            data: images.map((image) => ({
              productId: id,
              imageUrl: image.imageUrl,
              altText: image.altText,
              displayOrder: image.displayOrder ?? 0
            }))
          });
        }
      }
      return tx.product.update({ where: { id }, data, include: productInclude });
    });
  }

  disable(id: string) {
    return this.prisma.product.update({ where: { id }, data: { status: 'inactive' }, include: productInclude });
  }
}
