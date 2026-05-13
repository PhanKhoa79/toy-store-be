import { Module } from '@nestjs/common';
import { ProductMapper } from '@/modules/products/mappers/product.mapper';
import { CartController } from '@/modules/cart/controllers/cart.controller';
import { CartRepository } from '@/modules/cart/repositories/cart.repository';
import { CartService } from '@/modules/cart/services/cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService, CartRepository, ProductMapper],
  exports: [CartService, CartRepository]
})
export class CartModule {}
