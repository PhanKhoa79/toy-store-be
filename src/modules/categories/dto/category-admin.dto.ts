import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { EntityStatus } from '@/common/contracts';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class AdminListCategoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'giáo dục' })
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

export class CreateCategoryDto {
  @ApiProperty({ example: 'Đồ chơi giáo dục' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'do-choi-giao-duc' })
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

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

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
