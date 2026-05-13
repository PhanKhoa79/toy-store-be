import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { EntityStatus, ProductGender } from '@/common/contracts';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

const entityStatuses: EntityStatus[] = ['active', 'inactive'];
const genders: ProductGender[] = ['boy', 'girl', 'unisex'];

export class AdminListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'lego', description: 'Search by product name or SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: entityStatuses, description: 'Filter by product status' })
  @IsOptional()
  @IsIn(entityStatuses)
  status?: EntityStatus;

  @ApiPropertyOptional({ example: 'b4e8f1d9-cf5d-4dd8-8fb0-688d42a7341d' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: '1a68a4f4-81a1-44b7-b925-56a1dd573db2' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ enum: genders })
  @IsOptional()
  @IsIn(genders)
  gender?: ProductGender;

  @ApiPropertyOptional({ example: 100000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

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
  sortBy: 'createdAt' | 'updatedAt' | 'price' | 'stock' | 'name' = 'createdAt';
}
