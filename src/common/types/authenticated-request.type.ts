import type { Request } from 'express';
import type { CurrentUser, Permission, UserRole } from '@/common/contracts';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Exclude<UserRole, 'guest'>;
};

export type AuthenticatedRequest = Request & {
  user?: CurrentUser;
  jwtPayload?: JwtPayload;
  cookies?: Record<string, string>;
};

export type PermissionRequirement = Pick<Permission, 'module' | 'action'>;
