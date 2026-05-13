import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { EntityStatus } from '@/common/contracts';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class AdminListBrandsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'tiny' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: EntityStatus;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'displayOrder', 'name'], default: 'displayOrder' })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'displayOrder', 'name'])
  sortBy: 'createdAt' | 'updatedAt' | 'displayOrder' | 'name' = 'displayOrder';
}

export class CreateBrandDto {
  @ApiProperty({ example: 'Tiny Stars' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'tiny-stars' })
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '/uploads/brands/tiny-stars.jpg' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ enum: ['active', 'inactive'], default: 'active' })
  @IsIn(['active', 'inactive'])
  status!: EntityStatus;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
