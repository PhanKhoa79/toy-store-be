import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '@/common/constants/metadata-key.constant';
import { ApiException } from '@/common/exceptions/api.exception';
import type { AuthenticatedRequest, JwtPayload } from '@/common/types/authenticated-request.type';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) throw new ApiException('COMMON_UNAUTHORIZED', 'Bạn cần đăng nhập để tiếp tục.', HttpStatus.UNAUTHORIZED);

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET')
      });
      request.jwtPayload = payload;
      request.user = await this.getCurrentUser(payload.sub);
      return true;
    } catch {
      throw new ApiException('COMMON_UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', HttpStatus.UNAUTHORIZED);
    }
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const authHeader = request.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    return request.cookies?.access_token ?? bearerToken;
  }

  private async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userPermissions: { include: { permission: true } } }
    });
    if (!user || !user.isActive || user.lockedAt) {
      throw new ApiException('COMMON_UNAUTHORIZED', 'Tài khoản không hợp lệ hoặc đã bị khóa.', HttpStatus.UNAUTHORIZED);
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as 'customer' | 'staff' | 'admin',
      isActive: user.isActive,
      permissions: user.userPermissions.map(({ permission }) => ({
        id: permission.id,
        module: permission.module,
        action: permission.action,
        description: permission.description
      }))
    };
  }
}
