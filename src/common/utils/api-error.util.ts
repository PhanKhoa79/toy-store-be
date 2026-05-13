import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@/common/contracts';

export function defaultErrorCode(status: number): ErrorCode {
  if (status === HttpStatus.BAD_REQUEST) return 'COMMON_VALIDATION_ERROR';
  if (status === HttpStatus.UNAUTHORIZED) return 'COMMON_UNAUTHORIZED';
  if (status === HttpStatus.FORBIDDEN) return 'COMMON_FORBIDDEN';
  if (status === HttpStatus.NOT_FOUND) return 'COMMON_NOT_FOUND';
  if (status === HttpStatus.CONFLICT) return 'COMMON_CONFLICT';
  return 'COMMON_INTERNAL_ERROR';
}

export function defaultErrorMessage(status: number) {
  if (status === HttpStatus.BAD_REQUEST) return 'Dữ liệu không hợp lệ.';
  if (status === HttpStatus.UNAUTHORIZED) return 'Bạn cần đăng nhập để tiếp tục.';
  if (status === HttpStatus.FORBIDDEN) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === HttpStatus.NOT_FOUND) return 'Không tìm thấy dữ liệu.';
  if (status === HttpStatus.CONFLICT) return 'Dữ liệu đã tồn tại hoặc xung đột.';
  return 'Có lỗi xảy ra. Vui lòng thử lại sau.';
}
