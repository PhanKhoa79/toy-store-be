import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { ApiException } from '@/common/exceptions/api.exception';
import type { UploadFolder } from '@/modules/uploads/dto/upload-file.query';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const maxFileSize = 5 * 1024 * 1024;

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  async saveImage(file: Express.Multer.File | undefined, folder: UploadFolder) {
    if (!file) throw new ApiException('UPLOAD_FILE_INVALID', 'File tải lên không hợp lệ.', HttpStatus.BAD_REQUEST);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiException('UPLOAD_FILE_INVALID', 'Chỉ hỗ trợ file ảnh JPG, PNG, WEBP hoặc GIF.', HttpStatus.BAD_REQUEST);
    }
    if (file.size > maxFileSize) {
      throw new ApiException('UPLOAD_FILE_INVALID', 'File ảnh không được vượt quá 5MB.', HttpStatus.BAD_REQUEST);
    }

    const uploadRoot = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    const extension = extname(file.originalname).toLowerCase() || this.extensionFromMime(file.mimetype);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const relativeFolder = folder;
    const targetDir = join(process.cwd(), uploadRoot, relativeFolder);
    const targetPath = join(targetDir, fileName);

    try {
      await mkdir(targetDir, { recursive: true });
      await writeFile(targetPath, file.buffer);
    } catch {
      throw new ApiException('UPLOAD_FAILED', 'Tải file thất bại.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      url: `/uploads/${relativeFolder}/${fileName}`,
      fileName,
      mimeType: file.mimetype,
      size: file.size
    };
  }

  private extensionFromMime(mimeType: string) {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    if (mimeType === 'image/gif') return '.gif';
    return '.jpg';
  }
}
