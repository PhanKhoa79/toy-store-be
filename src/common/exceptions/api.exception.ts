import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@/common/contracts';

export class ApiException extends HttpException {
  constructor(code: ErrorCode, message: string, status: HttpStatus, details?: Record<string, unknown>) {
    super({ code, message, ...(details ? { details } : {}) }, status);
  }
}
