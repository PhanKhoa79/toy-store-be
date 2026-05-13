import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class CreateConversationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  message!: string;
}

export class SendChatMessageDto {
  @ApiProperty()
  @IsString()
  message!: string;
}

export class AdminListConversationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'open', 'closed'] })
  @IsOptional()
  @IsString()
  status?: string;
}
