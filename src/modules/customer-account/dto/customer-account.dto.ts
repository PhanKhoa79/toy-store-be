import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MaxLength(255)
  fullName!: string;

  @ApiPropertyOptional({ example: '0900000000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  recipientName!: string;

  @ApiProperty({ example: '0900000000' })
  @IsString()
  recipientPhone!: string;

  @ApiProperty({ example: '123 Đường Demo, Quận 1' })
  @IsString()
  addressLine!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateAddressDto extends CreateAddressDto {}

export class AddWishlistItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;
}
