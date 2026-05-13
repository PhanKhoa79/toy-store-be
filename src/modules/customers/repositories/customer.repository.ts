import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where });
  }

  findMany(where: Prisma.UserWhereInput, page: number, pageSize: number) {
    return this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, email: true, fullName: true, phone: true, isActive: true, lockedAt: true, lastLoginAt: true, createdAt: true, updatedAt: true } });
  }

  findDetail(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: 'customer' }, select: { id: true, email: true, fullName: true, phone: true, isActive: true, lockedAt: true, lastLoginAt: true, createdAt: true, updatedAt: true, orders: { orderBy: { createdAt: 'desc' }, take: 20 } } });
  }

  updateLock(id: string, locked: boolean) {
    return this.prisma.user.update({ where: { id }, data: { lockedAt: locked ? new Date() : null }, select: { id: true, email: true, fullName: true, phone: true, isActive: true, lockedAt: true, lastLoginAt: true, createdAt: true, updatedAt: true } });
  }
}
