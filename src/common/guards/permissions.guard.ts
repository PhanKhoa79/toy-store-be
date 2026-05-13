import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@/common/constants/metadata-key.constant';
import { ApiException } from '@/common/exceptions/api.exception';
import type { AuthenticatedRequest, PermissionRequirement } from '@/common/types/authenticated-request.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirements = this.reflector.getAllAndOverride<PermissionRequirement[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!requirements?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) throw new ApiException('COMMON_UNAUTHORIZED', 'Bạn cần đăng nhập để tiếp tục.', HttpStatus.UNAUTHORIZED);
    if (user.role === 'admin') return true;
    if (user.role !== 'staff') throw new ApiException('COMMON_FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', HttpStatus.FORBIDDEN);

    const hasPermission = requirements.some((requirement) =>
      user.permissions.some((permission) =>
        permission.module === requirement.module && (permission.action === requirement.action || permission.action === 'manage')
      )
    );
    if (!hasPermission) throw new ApiException('PERMISSION_DENIED', 'Bạn không có quyền thực hiện thao tác này.', HttpStatus.FORBIDDEN);
    return true;
  }
}
