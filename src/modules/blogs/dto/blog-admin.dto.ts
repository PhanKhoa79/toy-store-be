import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { BlogStatus } from '@/common/contracts';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class AdminListBlogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'đồ chơi' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: BlogStatus;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'publishedAt', 'title'], default: 'updatedAt' })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'publishedAt', 'title'])
  sortBy: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' = 'updatedAt';
}

export class CreateBlogDto {
  @ApiProperty({ example: 'Chọn đồ chơi an toàn cho bé' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'chon-do-choi-an-toan-cho-be' })
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: '/uploads/blogs/post.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'], default: 'draft' })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: BlogStatus;
}

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}
