import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

const cartInclude = { items: { include: { product: { include: { brand: true, category: true } } }, orderBy: { createdAt: 'desc' as const } } };

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCart(userId: string) {
    return this.prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  }

  getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({ where: { userId }, update: {}, create: { userId }, include: cartInclude });
  }

  findProduct(id: string) {
    return this.prisma.product.findUnique({ where: { id }, include: { brand: true, category: true } });
  }

  findCartItem(id: string) {
    return this.prisma.cartItem.findUnique({ where: { id }, include: { cart: true, product: { include: { brand: true, category: true } } } });
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const cart = await this.prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity }
    });
    return this.findCart(userId);
  }

  async updateItem(cartItemId: string, quantity: number) {
    const item = await this.prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
    const cart = await this.prisma.cart.findUniqueOrThrow({ where: { id: item.cartId } });
    return this.findCart(cart.userId);
  }

  async removeItem(cartItemId: string) {
    const item = await this.prisma.cartItem.delete({ where: { id: cartItemId } });
    const cart = await this.prisma.cart.findUniqueOrThrow({ where: { id: item.cartId } });
    return this.findCart(cart.userId);
  }
}
