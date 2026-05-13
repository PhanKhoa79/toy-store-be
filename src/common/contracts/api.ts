import type { ErrorCode } from './errors';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginationQuery = {
  page?: number;
  pageSize?: number;
};

export type ApiError = {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
};

export type ApiFailure = {
  success: false;
  error: ApiError;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ApiPaginatedResponse<T> = ApiSuccess<T[]> & {
  meta: PaginationMeta;
};
