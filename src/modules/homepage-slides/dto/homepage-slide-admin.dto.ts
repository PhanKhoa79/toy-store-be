import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class AdminListHomepageSlidesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'displayOrder', 'title'], default: 'displayOrder' })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'displayOrder', 'title'])
  sortBy: 'createdAt' | 'updatedAt' | 'displayOrder' | 'title' = 'displayOrder';
}

export class CreateHomepageSlideDto {
  @ApiProperty({ example: 'Toyshop MVP' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Đồ chơi an toàn, vui học mỗi ngày' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @ApiProperty({ example: '/uploads/slides/demo-slide.jpg' })
  @IsString()
  imageUrl!: string;

  @ApiPropertyOptional({ example: '/products' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiProperty({ example: 1, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder!: number;

  @ApiProperty({ example: true })
  @Type(() => Boolean)
  @IsBoolean()
  isActive!: boolean;
}

export class UpdateHomepageSlideDto extends PartialType(CreateHomepageSlideDto) {}
