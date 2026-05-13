import { Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { UploadFileQueryDto } from '@/modules/uploads/dto/upload-file.query';
import { UploadService } from '@/modules/uploads/services/upload.service';

@ApiTags('uploads')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Permissions(
    { module: 'admin-product-management', action: 'create' },
    { module: 'category-brand-management', action: 'create' },
    { module: 'blog-management', action: 'create' },
    { module: 'homepage-slide', action: 'create' }
  )
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload image file for admin forms' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' }
      },
      required: ['file']
    }
  })
  @ApiCreatedResponse({ description: 'Uploaded file URL and metadata' })
  @ApiStandardErrors()
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Query() query: UploadFileQueryDto) {
    return this.uploadService.saveImage(file, query.folder);
  }
}
