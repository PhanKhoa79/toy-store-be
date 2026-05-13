import { Module } from '@nestjs/common';
import { UploadController } from '@/modules/uploads/controllers/upload.controller';
import { UploadService } from '@/modules/uploads/services/upload.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService]
})
export class UploadsModule {}
