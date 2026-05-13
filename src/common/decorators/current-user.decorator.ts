import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUser } from '@/common/contracts';
import type { AuthenticatedRequest } from '@/common/types/authenticated-request.type';

export const CurrentUserDecorator = createParamDecorator((_data: unknown, ctx: ExecutionContext): CurrentUser | undefined => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});
