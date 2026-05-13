import { Module } from '@nestjs/common';
import { AdminBrandController } from '@/modules/brands/controllers/admin-brand.controller';
import { BrandController } from '@/modules/brands/controllers/brand.controller';
import { BrandRepository } from '@/modules/brands/repositories/brand.repository';
import { BrandService } from '@/modules/brands/services/brand.service';

@Module({
  controllers: [BrandController, AdminBrandController],
  providers: [BrandService, BrandRepository],
  exports: [BrandService, BrandRepository]
})
export class BrandsModule {}
