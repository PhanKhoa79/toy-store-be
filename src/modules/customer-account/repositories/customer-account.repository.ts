import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class CustomerAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  updateProfile(userId: string, data: { fullName: string; phone?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  listAddresses(userId: string) {
    return this.prisma.customerAddress.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  findAddress(id: string) {
    return this.prisma.customerAddress.findUnique({ where: { id } });
  }

  createAddress(userId: string, data: { recipientName: string; recipientPhone: string; addressLine: string; note?: string }) {
    return this.prisma.customerAddress.create({ data: { ...data, userId } });
  }

  updateAddress(id: string, data: { recipientName: string; recipientPhone: string; addressLine: string; note?: string }) {
    return this.prisma.customerAddress.update({ where: { id }, data });
  }

  deleteAddress(id: string) {
    return this.prisma.customerAddress.delete({ where: { id } });
  }

  async setDefaultAddress(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.customerAddress.update({ where: { id }, data: { isDefault: true } });
    });
  }

  listWishlist(userId: string) {
    return this.prisma.wishlistItem.findMany({ where: { userId }, include: { product: { include: { brand: true, category: true } } }, orderBy: { createdAt: 'desc' } });
  }

  findWishlistItem(userId: string, productId: string) {
    return this.prisma.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } });
  }

  createWishlistItem(userId: string, productId: string) {
    return this.prisma.wishlistItem.create({ data: { userId, productId }, include: { product: { include: { brand: true, category: true } } } });
  }

  deleteWishlistItem(userId: string, productId: string) {
    return this.prisma.wishlistItem.delete({ where: { userId_productId: { userId, productId } } });
  }

  findProduct(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }
}
