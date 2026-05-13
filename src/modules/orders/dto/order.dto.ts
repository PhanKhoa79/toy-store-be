import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { OrderStatus, PaymentStatus } from '@/common/contracts';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class AdminListOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'TS-' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'] })
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'])
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({ enum: ['pending', 'paid', 'failed', 'refunded'] })
  @IsOptional()
  @IsIn(['pending', 'paid', 'failed', 'refunded'])
  paymentStatus?: PaymentStatus;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'] })
  @IsIn(['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'])
  orderStatus!: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelledReason?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelledReason?: string;
}
