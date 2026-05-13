import { Injectable } from '@nestjs/common';
import type { Permission, CurrentUser } from '@/common/contracts';

type UserWithPermissions = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  userPermissions: { permission: { id: string; module: string; action: string; description: string | null } }[];
};

@Injectable()
export class AuthMapper {
  toCurrentUser(user: UserWithPermissions): CurrentUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as CurrentUser['role'],
      isActive: user.isActive,
      permissions: user.userPermissions.map(({ permission }): Permission => ({
        id: permission.id,
        module: permission.module,
        action: permission.action,
        description: permission.description
      }))
    };
  }
}
