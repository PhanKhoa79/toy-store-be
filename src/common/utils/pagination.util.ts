import type { PaginationMeta } from '@/common/contracts';

export function createPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}
