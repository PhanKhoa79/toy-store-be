import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import type { EntityStatus, ProductGender } from '@/common/contracts';

class ProductImageInputDto {
  @ApiProperty({ example: '/uploads/products/product.jpg' })
  @IsString()
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'Ảnh sản phẩm' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Bộ xếp hình cầu vồng', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'bo-xep-hinh-cau-vong', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiProperty({ example: 'TS-BXH-001', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sku!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'b4e8f1d9-cf5d-4dd8-8fb0-688d42a7341d' })
  @IsString()
  brandId!: string;

  @ApiProperty({ example: '1a68a4f4-81a1-44b7-b925-56a1dd573db2' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ enum: ['boy', 'girl', 'unisex'] })
  @IsIn(['boy', 'girl', 'unisex'])
  gender!: ProductGender;

  @ApiPropertyOptional({ example: '3-5 tuổi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ageRange?: string;

  @ApiProperty({ example: 250000, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 219000, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salePrice?: number | null;

  @ApiProperty({ example: 40, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty({ enum: ['active', 'inactive'], default: 'active' })
  @IsIn(['active', 'inactive'])
  status!: EntityStatus;

  @ApiPropertyOptional({ example: '/uploads/products/product.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ type: [ProductImageInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];
}
