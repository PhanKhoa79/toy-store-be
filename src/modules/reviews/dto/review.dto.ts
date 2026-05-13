import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import type { ReviewStatus } from '@/common/contracts';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class PublicListReviewsQueryDto extends PaginationQueryDto {}

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class AdminListReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected', 'hidden'] })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'hidden'])
  status?: ReviewStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class UpdateReviewStatusDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'hidden'] })
  @IsIn(['approved', 'rejected', 'hidden'])
  status!: Exclude<ReviewStatus, 'pending'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  moderationNote?: string;
}
