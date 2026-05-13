import { Module } from '@nestjs/common';
import { AdminOrderController } from '@/modules/orders/controllers/admin-order.controller';
import { OrderController } from '@/modules/orders/controllers/order.controller';
import { OrderRepository } from '@/modules/orders/repositories/order.repository';
import { OrderService } from '@/modules/orders/services/order.service';

@Module({
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository]
})
export class OrdersModule {}
