import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { ProductDto } from '../../common/contracts/catalog';
import { ListProductsQueryDto } from './dto/list-products.query';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const where = this.buildProductWhere(query);

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      data: products.map((product) => this.toProductDto(product)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: 'active'
      },
      include: {
        brand: true,
        category: true
      }
    });

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found'
      });
    }

    return this.toProductDto(product);
  }

  private buildProductWhere(query: ListProductsQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      status: 'active'
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.gender) where.gender = query.gender;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {})
      };
    }

    return where;
  }

  private toProductDto(product: Prisma.ProductGetPayload<{ include: { brand: true; category: true } }>): ProductDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      description: product.description,
      brandId: product.brandId,
      categoryId: product.categoryId,
      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            slug: product.brand.slug,
            description: product.brand.description,
            logoUrl: product.brand.logoUrl,
            status: product.brand.status as ProductDto['status'],
            displayOrder: product.brand.displayOrder
          }
        : null,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description,
            status: product.category.status as ProductDto['status'],
            displayOrder: product.category.displayOrder
          }
        : null,
      gender: product.gender as ProductDto['gender'],
      ageRange: product.ageRange,
      price: product.price,
      salePrice: product.salePrice,
      stock: product.stock,
      status: product.status as ProductDto['status'],
      thumbnailUrl: product.thumbnailUrl
    };
  }
}
