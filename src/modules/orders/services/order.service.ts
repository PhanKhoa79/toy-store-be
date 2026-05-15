import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import { AdminListOrdersQueryDto, CancelOrderDto, UpdateOrderStatusDto } from '@/modules/orders/dto/order.dto';
import { OrderRepository } from '@/modules/orders/repositories/order.repository';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  listCustomerOrders(userId: string) {
    return this.orderRepository.findCustomerOrders(userId);
  }

  async getCustomerOrder(userId: string, orderCode: string) {
    const order = await this.orderRepository.findByOrderCode(orderCode);
    if (!order) throw new ApiException('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.', HttpStatus.NOT_FOUND);
    if (order.userId !== userId) throw new ApiException('ORDER_NOT_OWNED_BY_CUSTOMER', 'Đơn hàng không thuộc tài khoản hiện tại.', HttpStatus.FORBIDDEN);
    return order;
  }

  async cancelCustomerOrder(userId: string, orderCode: string, dto: CancelOrderDto) {
    const order = await this.getCustomerOrder(userId, orderCode);
    if (order.orderStatus !== 'pending' || order.paymentStatus === 'paid') throw new ApiException('ORDER_CANNOT_CANCEL', 'Không thể hủy đơn hàng này.', HttpStatus.BAD_REQUEST);
    return this.orderRepository.update(order.id, { orderStatus: 'cancelled', cancelledReason: dto.cancelledReason });
  }

  async listAdminOrders(query: AdminListOrdersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.OrderWhereInput = {};
    if (query.search) where.OR = [{ orderCode: { contains: query.search, mode: 'insensitive' } }, { recipientName: { contains: query.search, mode: 'insensitive' } }, { recipientPhone: { contains: query.search, mode: 'insensitive' } }];
    if (query.orderStatus) where.orderStatus = query.orderStatus;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    const [total, orders] = await Promise.all([this.orderRepository.count(where), this.orderRepository.findMany(where, page, pageSize)]);
    return { data: orders, meta: createPaginationMeta(page, pageSize, total) };
  }

  async getAdminOrder(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new ApiException('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.', HttpStatus.NOT_FOUND);
    return order;
  }

  async updateAdminOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.getAdminOrder(id);
    this.validateStatusTransition(order.orderStatus, dto.orderStatus);
    if (dto.orderStatus === 'cancelled' && !dto.cancelledReason) {
      throw new ApiException('COMMON_VALIDATION_ERROR', 'Lý do hủy đơn hàng là bắt buộc.', HttpStatus.BAD_REQUEST);
    }
    return this.orderRepository.update(id, { orderStatus: dto.orderStatus, ...(dto.orderStatus === 'cancelled' ? { cancelledReason: dto.cancelledReason } : {}) });
  }

  private validateStatusTransition(current: string, next: string) {
    if (current === next) return;
    const allowed: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipping', 'cancelled'],
      shipping: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };
    if (!allowed[current]?.includes(next)) {
      throw new ApiException('ORDER_INVALID_STATUS_TRANSITION', 'Trạng thái đơn hàng không hợp lệ.', HttpStatus.BAD_REQUEST);
    }
  }
}
