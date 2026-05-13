import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

const userSelect = { id: true, email: true, fullName: true, phone: true, role: true, isActive: true, lockedAt: true, lastLoginAt: true, createdAt: true, updatedAt: true };

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.UserWhereInput) { return this.prisma.user.count({ where }); }
  findMany(where: Prisma.UserWhereInput, page: number, pageSize: number) { return this.prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }); }
  findByEmail(email: string) { return this.prisma.user.findUnique({ where: { email } }); }
  findById(id: string) { return this.prisma.user.findUnique({ where: { id }, select: { ...userSelect, userPermissions: { include: { permission: true } } } }); }
  countActiveAdmins(excludedId?: string) { return this.prisma.user.count({ where: { role: 'admin', isActive: true, lockedAt: null, ...(excludedId ? { id: { not: excludedId } } : {}) } }); }
  create(data: Prisma.UserCreateInput) { return this.prisma.user.create({ data, select: userSelect }); }
  update(id: string, data: Prisma.UserUpdateInput) { return this.prisma.user.update({ where: { id }, data, select: userSelect }); }
  listPermissions() { return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] }); }
  async updatePermissions(userId: string, permissionIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({ where: { userId } });
      if (permissionIds.length) await tx.userPermission.createMany({ data: permissionIds.map((permissionId) => ({ userId, permissionId })) });
      return tx.user.findUnique({ where: { id: userId }, select: { ...userSelect, userPermissions: { include: { permission: true } } } });
    });
  }
}
