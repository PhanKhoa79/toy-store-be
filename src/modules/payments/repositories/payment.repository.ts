import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.payment.findUnique({ where: { id }, include: { order: true } });
  }

  findByTransactionRef(transactionRef: string) {
    return this.prisma.payment.findUnique({ where: { transactionRef }, include: { order: true } });
  }

  markPaid(transactionRef: string, data: { vnpayTransactionNo?: string; vnpayResponseCode?: string; vnpayBankCode?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({ where: { transactionRef }, data: { paymentStatus: 'paid', paidAt: new Date(), ...data } });
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'paid', orderStatus: 'confirmed' } });
      return payment;
    });
  }

  markFailed(transactionRef: string, data: { vnpayResponseCode?: string; vnpayBankCode?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({ where: { transactionRef }, data: { paymentStatus: 'failed', ...data } });
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'failed' } });
      return payment;
    });
  }
}
