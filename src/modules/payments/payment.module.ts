import { Module } from '@nestjs/common';
import { PaymentController } from '@/modules/payments/controllers/payment.controller';
import { PaymentRepository } from '@/modules/payments/repositories/payment.repository';
import { PaymentService } from '@/modules/payments/services/payment.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService, PaymentRepository]
})
export class PaymentModule {}
