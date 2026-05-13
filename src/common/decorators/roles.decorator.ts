import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@/common/contracts';
import { ROLES_KEY } from '@/common/constants/metadata-key.constant';

export const Roles = (...roles: Exclude<UserRole, 'guest'>[]) => SetMetadata(ROLES_KEY, roles);
