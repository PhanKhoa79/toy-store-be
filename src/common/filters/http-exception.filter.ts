import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { ErrorCode } from '@/common/contracts';

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
        code: source.code ?? this.defaultCode(status),
        message: message ?? this.defaultMessage(status),
        ...(source.details ? { details: source.details } : {})
      };
    }

    if (typeof body === 'string') {
      return {
        code: this.defaultCode(status),
        message: body
      };
    }

    return {
      code: this.defaultCode(status),
      message: this.defaultMessage(status)
    };
  }

  private defaultCode(status: number): ErrorCode {
    if (status === HttpStatus.BAD_REQUEST) return 'COMMON_VALIDATION_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) return 'COMMON_UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'COMMON_FORBIDDEN';
    if (status === HttpStatus.NOT_FOUND) return 'RESOURCE_NOT_FOUND';
    return 'INTERNAL_SERVER_ERROR';
  }

  private defaultMessage(status: number) {
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) return 'Internal server error';
    return 'Request failed';
  }
}
