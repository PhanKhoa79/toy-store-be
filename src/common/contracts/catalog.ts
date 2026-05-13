import type { PaginationQuery } from './api';
import type { ID, VndAmount } from './common';
import type { EntityStatus, ProductGender } from './enums';

export type CategoryDto = {
  id: ID;
  name: string;
  slug: string;
  description?: string | null;
  status: EntityStatus;
  displayOrder: number;
};

export type BrandDto = {
  id: ID;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  status: EntityStatus;
  displayOrder: number;
};

export type ProductDto = {
  id: ID;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string | null;
  description?: string | null;
  brandId: ID;
  categoryId: ID;
  brand?: BrandDto | null;
  category?: CategoryDto | null;
  gender: ProductGender;
  ageRange?: string | null;
  price: VndAmount;
  salePrice?: VndAmount | null;
  stock: number;
  status: EntityStatus;
  thumbnailUrl?: string | null;
};

export type ProductListQuery = PaginationQuery & {
  search?: string;
  categoryId?: ID;
  brandId?: ID;
  gender?: ProductGender;
  minPrice?: VndAmount;
  maxPrice?: VndAmount;
};
