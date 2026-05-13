import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { ErrorCode } from '@/common/contracts';
import { defaultErrorCode, defaultErrorMessage } from '@/common/utils/api-error.util';

type ErrorResponseBody = {
  error?: {
    code?: ErrorCode;
    message?: string | string[];
    details?: Record<string, unknown>;
  };
  code?: ErrorCode;
  message?: string | string[];
  details?: Record<string, unknown>;
};

type NormalizedError = {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : undefined;
    const error = this.normalizeErrorBody(body, status);

    response.status(status).json({
      success: false,
      error
    });
  }

  private normalizeErrorBody(body: unknown, status: number): NormalizedError {
    if (typeof body === 'object' && body !== null) {
      const typedBody = body as ErrorResponseBody;
      const source = typedBody.error ?? typedBody;
      const message = Array.isArray(source.message) ? source.message.join(', ') : source.message;
      return {
        code: source.code ?? defaultErrorCode(status),
        message: message ?? defaultErrorMessage(status),
        ...(source.details ? { details: source.details } : {})
      };
    }

    if (typeof body === 'string') {
      return {
        code: defaultErrorCode(status),
        message: body
      };
    }

    return {
      code: defaultErrorCode(status),
      message: defaultErrorMessage(status)
    };
  }
}
