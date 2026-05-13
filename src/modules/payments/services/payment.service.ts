import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { ApiException } from '@/common/exceptions/api.exception';
import { PaymentRepository } from '@/modules/payments/repositories/payment.repository';

type VnpayQuery = Record<string, string | undefined>;

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository, private readonly configService: ConfigService) {}

  buildVnpayPaymentUrl(transactionRef: string, amount: number) {
    const paymentUrl = this.configService.get<string>('VNPAY_PAYMENT_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL', 'http://localhost:3000/payment/vnpay-return');
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE', 'change-me');
    const params = new URLSearchParams({ vnp_TmnCode: tmnCode, vnp_TxnRef: transactionRef, vnp_Amount: String(amount * 100), vnp_ReturnUrl: returnUrl, vnp_Command: 'pay', vnp_CurrCode: 'VND', vnp_Locale: 'vn' });
    const secureHash = this.sign(params);
    params.set('vnp_SecureHash', secureHash);
    return `${paymentUrl}?${params.toString()}`;
  }

  async getPayment(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new ApiException('PAYMENT_NOT_FOUND', 'Không tìm thấy thanh toán.', HttpStatus.NOT_FOUND);
    return payment;
  }

  async getPaymentResult(query: VnpayQuery) {
    const payment = await this.findPaymentFromQuery(query);
    return this.toResult(payment, query.vnp_ResponseCode);
  }

  async handleVnpayCallback(query: VnpayQuery) {
    this.verifySecureHash(query);
    const payment = await this.findPaymentFromQuery(query);
    this.verifyAmount(query, payment.amount);

    if (query.vnp_ResponseCode === '00') {
      if (payment.paymentStatus !== 'paid') {
        await this.paymentRepository.markPaid(payment.transactionRef, { vnpayTransactionNo: query.vnp_TransactionNo, vnpayResponseCode: query.vnp_ResponseCode, vnpayBankCode: query.vnp_BankCode });
      }
      return { ...this.toResult(payment, query.vnp_ResponseCode, true), paymentStatus: 'paid', orderStatus: 'confirmed' };
    }

    if (payment.paymentStatus === 'pending') {
      await this.paymentRepository.markFailed(payment.transactionRef, { vnpayResponseCode: query.vnp_ResponseCode, vnpayBankCode: query.vnp_BankCode });
      return { ...this.toResult(payment, query.vnp_ResponseCode, false), paymentStatus: 'failed' };
    }
    return this.toResult(payment, query.vnp_ResponseCode, false);
  }

  private async findPaymentFromQuery(query: VnpayQuery) {
    const transactionRef = query.vnp_TxnRef ?? query.transactionRef;
    if (!transactionRef) throw new ApiException('PAYMENT_NOT_FOUND', 'Không tìm thấy giao dịch.', HttpStatus.NOT_FOUND);
    const payment = await this.paymentRepository.findByTransactionRef(transactionRef);
    if (!payment) throw new ApiException('PAYMENT_NOT_FOUND', 'Không tìm thấy thanh toán.', HttpStatus.NOT_FOUND);
    return payment;
  }

  private verifyAmount(query: VnpayQuery, amount: number) {
    if (!query.vnp_Amount) return;
    if (Number(query.vnp_Amount) !== amount * 100) throw new ApiException('PAYMENT_AMOUNT_MISMATCH', 'Số tiền thanh toán không khớp.', HttpStatus.BAD_REQUEST);
  }

  private verifySecureHash(query: VnpayQuery) {
    const secureHash = query.vnp_SecureHash;
    if (!secureHash) throw new ApiException('PAYMENT_VNPAY_CHECKSUM_INVALID', 'Chữ ký thanh toán không hợp lệ.', HttpStatus.BAD_REQUEST);
    const params = new URLSearchParams();
    Object.keys(query)
      .filter((key) => key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && query[key] !== undefined)
      .sort()
      .forEach((key) => params.append(key, query[key] as string));
    const expected = this.sign(params);
    const receivedBuffer = Buffer.from(secureHash.toLowerCase());
    const expectedBuffer = Buffer.from(expected.toLowerCase());
    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      throw new ApiException('PAYMENT_VNPAY_CHECKSUM_INVALID', 'Chữ ký thanh toán không hợp lệ.', HttpStatus.BAD_REQUEST);
    }
  }

  private toResult(payment: NonNullable<Awaited<ReturnType<PaymentRepository['findByTransactionRef']>>>, responseCode?: string, success = responseCode === '00') {
    return { paymentId: payment.id, orderCode: payment.order.orderCode, transactionRef: payment.transactionRef, responseCode, success, paymentStatus: payment.paymentStatus, orderStatus: payment.order.orderStatus };
  }

  private sign(params: URLSearchParams) {
    const secret = this.configService.get<string>('VNPAY_HASH_SECRET', 'change-me');
    return createHmac('sha512', secret).update(params.toString()).digest('hex');
  }
}
