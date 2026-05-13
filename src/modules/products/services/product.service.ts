import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import { AdminListProductsQueryDto } from '@/modules/products/dto/admin-list-products.query';
import { CreateProductDto } from '@/modules/products/dto/create-product.dto';
import { ListProductsQueryDto } from '@/modules/products/dto/list-products.query';
import { UpdateProductDto } from '@/modules/products/dto/update-product.dto';
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
    const where = this.buildProductWhere(query, true);
    const orderBy = this.buildProductOrderBy(query);
    const [total, products] = await Promise.all([
      this.productRepository.count(where),
      this.productRepository.findMany(where, page, pageSize, orderBy)
    ]);
    return { data: products.map((product) => this.productMapper.toDto(product)), meta: createPaginationMeta(page, pageSize, total) };
  }

  async listAdminProducts(query: AdminListProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildAdminProductWhere(query);
    const orderBy = this.buildAdminProductOrderBy(query);
    const [total, products] = await Promise.all([
      this.productRepository.count(where),
      this.productRepository.findMany(where, page, pageSize, orderBy)
    ]);
    return { data: products.map((product) => this.productMapper.toDto(product)), meta: createPaginationMeta(page, pageSize, total) };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepository.findActiveBySlug(slug);
    if (!product) throw new ApiException('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.', HttpStatus.NOT_FOUND);
    return this.productMapper.toDto(product);
  }

  async getAdminProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new ApiException('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.', HttpStatus.NOT_FOUND);
    return this.productMapper.toDto(product);
  }

  async createProduct(dto: CreateProductDto) {
    await this.validateProductReference(dto.brandId, dto.categoryId);
    await this.validateUniqueProduct(dto.slug, dto.sku);
    this.validatePrice(dto.price, dto.salePrice);
    const product = await this.productRepository.create(this.toCreateInput(dto), dto.images);
    return this.productMapper.toDto(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.productRepository.findById(id);
    if (!existing) throw new ApiException('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.', HttpStatus.NOT_FOUND);
    if (dto.brandId || dto.categoryId) await this.validateProductReference(dto.brandId ?? existing.brandId, dto.categoryId ?? existing.categoryId);
    if (dto.slug || dto.sku) await this.validateUniqueProduct(dto.slug ?? existing.slug, dto.sku ?? existing.sku, id);
    this.validatePrice(dto.price ?? existing.price, dto.salePrice === undefined ? existing.salePrice : dto.salePrice);
    const product = await this.productRepository.update(id, this.toUpdateInput(dto), dto.images);
    return this.productMapper.toDto(product);
  }

  async disableProduct(id: string) {
    const existing = await this.productRepository.findById(id);
    if (!existing) throw new ApiException('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.', HttpStatus.NOT_FOUND);
    const product = await this.productRepository.disable(id);
    return this.productMapper.toDto(product);
  }

  private buildProductOrderBy(query: ListProductsQueryDto): Prisma.ProductOrderByWithRelationInput {
    return { [query.sortBy ?? 'createdAt']: query.sortDirection ?? 'desc' };
  }

  private buildAdminProductOrderBy(query: AdminListProductsQueryDto): Prisma.ProductOrderByWithRelationInput {
    return { [query.sortBy ?? 'createdAt']: query.sortDirection ?? 'desc' };
  }

  private buildProductWhere(query: ListProductsQueryDto, activeOnly: boolean): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = activeOnly ? { status: 'active', category: { status: 'active' }, brand: { status: 'active' } } : {};
    if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { sku: { contains: query.search, mode: 'insensitive' } }];
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.gender) where.gender = query.gender;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) };
    }
    return where;
  }

  private buildAdminProductWhere(query: AdminListProductsQueryDto): Prisma.ProductWhereInput {
    const where = this.buildProductWhere({
      page: query.page,
      pageSize: query.pageSize,
      sortDirection: query.sortDirection,
      sortBy: query.sortBy === 'updatedAt' || query.sortBy === 'stock' ? 'createdAt' : query.sortBy,
      search: query.search,
      categoryId: query.categoryId,
      brandId: query.brandId,
      gender: query.gender,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice
    }, false);
    if (query.status) where.status = query.status;
    if (query.sku) where.sku = query.sku;
    if (query.stockState === 'inStock') where.stock = { gt: 0 };
    if (query.stockState === 'outOfStock') where.stock = 0;
    if (query.stockState === 'lowStock') where.stock = { gt: 0, lte: 5 };
    return where;
  }

  private async validateProductReference(brandId: string, categoryId: string) {
    const [brand, category] = await Promise.all([this.productRepository.findBrandById(brandId), this.productRepository.findCategoryById(categoryId)]);
    if (!brand) throw new ApiException('BRAND_NOT_FOUND', 'Không tìm thấy thương hiệu.', HttpStatus.NOT_FOUND);
    if (!category) throw new ApiException('CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.', HttpStatus.NOT_FOUND);
    if (brand.status !== 'active') throw new ApiException('BRAND_NOT_FOUND', 'Thương hiệu không hợp lệ.', HttpStatus.BAD_REQUEST);
    if (category.status !== 'active') throw new ApiException('CATEGORY_NOT_FOUND', 'Danh mục không hợp lệ.', HttpStatus.BAD_REQUEST);
  }

  private async validateUniqueProduct(slug: string, sku: string, excludedId?: string) {
    const [slugProduct, skuProduct] = await Promise.all([this.productRepository.findBySlug(slug), this.productRepository.findBySku(sku)]);
    if (slugProduct && slugProduct.id !== excludedId) throw new ApiException('PRODUCT_SLUG_ALREADY_EXISTS', 'Slug sản phẩm đã tồn tại.', HttpStatus.CONFLICT);
    if (skuProduct && skuProduct.id !== excludedId) throw new ApiException('PRODUCT_SKU_ALREADY_EXISTS', 'SKU đã tồn tại.', HttpStatus.CONFLICT);
  }

  private validatePrice(price: number, salePrice?: number | null) {
    if (salePrice !== undefined && salePrice !== null && salePrice > price) {
      throw new ApiException('PRODUCT_INVALID_PRICE', 'Giá sản phẩm không hợp lệ.', HttpStatus.BAD_REQUEST);
    }
  }

  private toCreateInput(dto: CreateProductDto): Prisma.ProductCreateInput {
    return {
      name: dto.name,
      slug: dto.slug,
      sku: dto.sku,
      shortDescription: dto.shortDescription,
      description: dto.description,
      brand: { connect: { id: dto.brandId } },
      category: { connect: { id: dto.categoryId } },
      gender: dto.gender,
      ageRange: dto.ageRange,
      price: dto.price,
      salePrice: dto.salePrice,
      stock: dto.stock,
      status: dto.status,
      thumbnailUrl: dto.thumbnailUrl
    };
  }

  private toUpdateInput(dto: UpdateProductDto): Prisma.ProductUpdateInput {
    return {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
      ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.brandId !== undefined ? { brand: { connect: { id: dto.brandId } } } : {}),
      ...(dto.categoryId !== undefined ? { category: { connect: { id: dto.categoryId } } } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      ...(dto.ageRange !== undefined ? { ageRange: dto.ageRange } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.salePrice !== undefined ? { salePrice: dto.salePrice } : {}),
      ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.thumbnailUrl !== undefined ? { thumbnailUrl: dto.thumbnailUrl } : {})
    };
  }
}
