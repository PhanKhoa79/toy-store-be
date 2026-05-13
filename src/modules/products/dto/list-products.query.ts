import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { ProductGender } from '@/common/contracts';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

const genders: ProductGender[] = ['boy', 'girl', 'unisex'];

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 100, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  override pageSize = 12;

  @ApiPropertyOptional({ example: 'lego', description: 'Search by product name or SKU' })
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({ enum: ['createdAt', 'price', 'name'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'price', 'name'])
  sortBy: 'createdAt' | 'price' | 'name' = 'createdAt';
}
