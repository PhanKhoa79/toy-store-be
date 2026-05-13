import { Module } from '@nestjs/common';
import { AdminProductController } from '@/modules/products/controllers/admin-product.controller';
import { ProductController } from '@/modules/products/controllers/product.controller';
import { ProductMapper } from '@/modules/products/mappers/product.mapper';
import { ProductRepository } from '@/modules/products/repositories/product.repository';
import { ProductService } from '@/modules/products/services/product.service';

@Module({
  controllers: [ProductController, AdminProductController],
  providers: [ProductService, ProductRepository, ProductMapper]
})
export class ProductsModule {}
