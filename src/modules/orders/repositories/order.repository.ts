import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

const orderInclude = { user: { select: { id: true, fullName: true, email: true, phone: true } }, items: true, payments: true } satisfies Prisma.OrderInclude;

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  findMany(where: Prisma.OrderWhereInput, page: number, pageSize: number) {
    return this.prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize });
  }

  findCustomerOrders(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, include: { items: true, payments: true }, orderBy: { createdAt: 'desc' } });
  }

  findByOrderCode(orderCode: string) {
    return this.prisma.order.findUnique({ where: { orderCode }, include: orderInclude });
  }

  findById(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: orderInclude });
  }

  update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({ where: { id }, data, include: orderInclude });
  }
}
