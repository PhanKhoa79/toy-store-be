import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { userPermissions: { include: { permission: true } } }
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { userPermissions: { include: { permission: true } } }
    });
  }

  createCustomer(data: { email: string; passwordHash: string; fullName: string; phone?: string }) {
    return this.prisma.user.create({
      data: { ...data, role: 'customer' },
      include: { userPermissions: { include: { permission: true } } }
    });
  }

  updateLastLogin(id: string) {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }
}
