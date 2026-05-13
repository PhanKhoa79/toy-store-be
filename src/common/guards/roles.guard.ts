import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/common/constants/metadata-key.constant';
import { ApiException } from '@/common/exceptions/api.exception';
import type { UserRole } from '@/common/contracts';
import type { AuthenticatedRequest } from '@/common/types/authenticated-request.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Exclude<UserRole, 'guest'>[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) throw new ApiException('COMMON_UNAUTHORIZED', 'Bạn cần đăng nhập để tiếp tục.', HttpStatus.UNAUTHORIZED);
    if (!roles.includes(user.role)) throw new ApiException('COMMON_FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', HttpStatus.FORBIDDEN);
    return true;
  }
}
