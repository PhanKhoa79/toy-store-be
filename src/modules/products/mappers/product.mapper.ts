import { Injectable } from '@nestjs/common';
import type { ProductDto } from '@/common/contracts';
import type { ProductWithRelations } from '@/modules/products/repositories/product.repository';

@Injectable()
export class ProductMapper {
  toDto(product: ProductWithRelations): ProductDto {
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
