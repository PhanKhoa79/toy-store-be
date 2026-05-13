import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

const reviewInclude = {
  product: { select: { id: true, name: true } },
  user: { select: { id: true, fullName: true } }
} satisfies Prisma.ReviewInclude;

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.ReviewWhereInput) {
    return this.prisma.review.count({ where });
  }

  findMany(where: Prisma.ReviewWhereInput, page: number, pageSize: number, orderBy: Prisma.ReviewOrderByWithRelationInput) {
    return this.prisma.review.findMany({ where, include: reviewInclude, orderBy, skip: (page - 1) * pageSize, take: pageSize });
  }

  findPublicByProduct(productId: string, page: number, pageSize: number) {
    return this.prisma.review.findMany({ where: { productId, status: 'approved' }, include: { user: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize });
  }

  countPublicByProduct(productId: string) {
    return this.prisma.review.count({ where: { productId, status: 'approved' } });
  }

  findById(id: string) {
    return this.prisma.review.findUnique({ where: { id }, include: reviewInclude });
  }

  findEligibleDeliveredOrder(userId: string, productId: string, orderId: string) {
    return this.prisma.order.findFirst({ where: { id: orderId, userId, orderStatus: 'delivered', items: { some: { productId } } }, select: { id: true } });
  }

  findUserProductOrderReview(userId: string, productId: string, orderId: string) {
    return this.prisma.review.findUnique({ where: { productId_userId_orderId: { productId, userId, orderId } } });
  }

  create(data: Prisma.ReviewCreateInput) {
    return this.prisma.review.create({ data, include: reviewInclude });
  }

  updateStatus(id: string, data: Prisma.ReviewUpdateInput) {
    return this.prisma.review.update({ where: { id }, data, include: reviewInclude });
  }
}
