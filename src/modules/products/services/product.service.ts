import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListProductsQueryDto } from '@/modules/products/dto/list-products.query';
import { ProductMapper } from '@/modules/products/mappers/product.mapper';
import { ProductRepository } from '@/modules/products/repositories/product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productMapper: ProductMapper
  ) {}

  async listProducts(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const where = this.buildProductWhere(query);
    const orderBy = this.buildProductOrderBy(query);
    const [total, products] = await Promise.all([
      this.productRepository.count(where),
      this.productRepository.findMany(where, page, pageSize, orderBy)
    ]);

    return {
      data: products.map((product) => this.productMapper.toDto(product)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepository.findActiveBySlug(slug);
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    }
    return this.productMapper.toDto(product);
  }


  private buildProductOrderBy(query: ListProductsQueryDto): Prisma.ProductOrderByWithRelationInput {
    return {
      [query.sortBy ?? 'createdAt']: query.sortDirection ?? 'desc'
    };
  }

  private buildProductWhere(query: ListProductsQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { status: 'active' };
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
}
