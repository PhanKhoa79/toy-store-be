import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { EntityStatus, ProductGender } from '@/common/contracts';
import { ListProductsQueryDto } from './list-products.query';

const entityStatuses: EntityStatus[] = ['active', 'inactive'];
const genders: ProductGender[] = ['boy', 'girl', 'unisex'];

export class AdminListProductsQueryDto extends ListProductsQueryDto {
  @ApiPropertyOptional({ enum: entityStatuses, description: 'Filter by product status' })
  @IsOptional()
  @IsIn(entityStatuses)
  status?: EntityStatus;

  @ApiPropertyOptional({ enum: genders })
  @IsOptional()
  @IsIn(genders)
  override gender?: ProductGender;

  @ApiPropertyOptional({ enum: ['inStock', 'outOfStock', 'lowStock'] })
  @IsOptional()
  @IsIn(['inStock', 'outOfStock', 'lowStock'])
  stockState?: 'inStock' | 'outOfStock' | 'lowStock';

  @ApiPropertyOptional({ example: 'TS-BXH-001', description: 'Exact SKU filter for admin list' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'price', 'stock', 'name'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'price', 'stock', 'name'])
  override sortBy: 'createdAt' | 'updatedAt' | 'price' | 'stock' | 'name' = 'createdAt';
}
