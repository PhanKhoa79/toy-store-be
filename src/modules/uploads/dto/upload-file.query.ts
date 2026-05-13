import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const uploadFolders = ['products', 'brands', 'blogs', 'slides', 'chat'] as const;
export type UploadFolder = (typeof uploadFolders)[number];

export class UploadFileQueryDto {
  @ApiPropertyOptional({ enum: uploadFolders, default: 'products' })
  @IsOptional()
  @IsIn(uploadFolders)
  folder: UploadFolder = 'products';
}
