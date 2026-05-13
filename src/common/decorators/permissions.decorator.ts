import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '@/common/constants/metadata-key.constant';
import type { PermissionRequirement } from '@/common/types/authenticated-request.type';

export const Permissions = (...permissions: PermissionRequirement[]) => SetMetadata(PERMISSIONS_KEY, permissions);
