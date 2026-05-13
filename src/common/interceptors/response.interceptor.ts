import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

type ResponsePayload = {
  data?: unknown;
  meta?: Record<string, unknown>;
  success?: boolean;
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload: ResponsePayload | unknown) => {
        if (payload && typeof payload === 'object' && 'success' in payload) {
          return payload;
        }

        if (payload && typeof payload === 'object' && 'data' in payload) {
          const typedPayload = payload as ResponsePayload;
          return {
            success: true,
            data: typedPayload.data,
            ...(typedPayload.meta ? { meta: typedPayload.meta } : {})
          };
        }

        return {
          success: true,
          data: payload ?? null
        };
      })
    );
  }
}
