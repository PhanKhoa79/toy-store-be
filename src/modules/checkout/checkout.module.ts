import { Module } from '@nestjs/common';
import { PaymentModule } from '@/modules/payments/payment.module';
import { CheckoutController } from '@/modules/checkout/controllers/checkout.controller';
import { CheckoutService } from '@/modules/checkout/services/checkout.service';

@Module({
  imports: [PaymentModule],
  controllers: [CheckoutController],
  providers: [CheckoutService]
})
export class CheckoutModule {}
