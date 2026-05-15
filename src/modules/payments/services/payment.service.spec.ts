import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { ApiException } from '@/common/exceptions/api.exception';

describe('PaymentService', () => {
  let service: PaymentService;
  let repository: jest.Mocked<PaymentRepository>;
  let configService: jest.Mocked<ConfigService>;

  const mockPayment = {
    id: 'payment-id',
    transactionRef: 'TS-001',
    amount: 100000,
    paymentStatus: 'pending',
    order: { id: 'order-id', orderCode: 'TS-001', orderStatus: 'pending' }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: {
            findById: jest.fn(),
            findByTransactionRef: jest.fn(),
            markPaid: jest.fn(),
            markFailed: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
              const map: Record<string, string> = {
                VNPAY_PAYMENT_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
                VNPAY_RETURN_URL: 'http://localhost:3000/payment/vnpay-return',
                VNPAY_TMN_CODE: 'TEST123',
                VNPAY_HASH_SECRET: 'secret-key'
              };
              return map[key] ?? defaultValue;
            })
          }
        }
      ]
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    repository = module.get(PaymentRepository);
    configService = module.get(ConfigService);
  });

  let verifySpy: jest.SpyInstance | undefined;

  afterEach(() => {
    jest.clearAllMocks();
    verifySpy?.mockRestore();
  });

  describe('buildVnpayPaymentUrl', () => {
    it('should build payment URL with required params', () => {
      const url = service.buildVnpayPaymentUrl('TS-001', 100000);
      expect(url).toContain('vnp_TxnRef=TS-001');
      expect(url).toContain('vnp_Amount=10000000');
      expect(url).toContain('vnp_TmnCode=TEST123');
      expect(url).toContain('vnp_SecureHash=');
    });
  });

  describe('getPayment', () => {
    it('should return payment by id', async () => {
      repository.findById.mockResolvedValue(mockPayment as any);
      const result = await service.getPayment('payment-id');
      expect(result).toEqual(mockPayment);
    });

    it('should throw PAYMENT_NOT_FOUND when payment does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getPayment('payment-id')).rejects.toMatchObject({ response: { code: 'PAYMENT_NOT_FOUND' } });
    });
  });

  describe('getPaymentResult', () => {
    it('should return payment result', async () => {
      repository.findByTransactionRef.mockResolvedValue(mockPayment as any);
      const result = await service.getPaymentResult({ vnp_TxnRef: 'TS-001', vnp_ResponseCode: '00' });
      expect(result.success).toBe(true);
    });
  });

  describe('handleVnpayCallback', () => {
    beforeEach(() => {
      verifySpy = jest.spyOn(service as any, 'verifySecureHash').mockReturnValue(undefined);
    });

    it('should mark paid on successful response code 00', async () => {
      repository.findByTransactionRef.mockResolvedValue(mockPayment as any);
      repository.markPaid.mockResolvedValue({ ...mockPayment, paymentStatus: 'paid' } as any);
      const result = await service.handleVnpayCallback({ vnp_TxnRef: 'TS-001', vnp_ResponseCode: '00', vnp_Amount: '10000000', vnp_SecureHash: 'valid', vnp_TransactionNo: '123', vnp_BankCode: 'NCB' });
      expect(repository.markPaid).toHaveBeenCalled();
      expect(result.paymentStatus).toBe('paid');
      expect(result.orderStatus).toBe('confirmed');
    });

    it('should be idempotent when already paid', async () => {
      repository.findByTransactionRef.mockResolvedValue({ ...mockPayment, paymentStatus: 'paid' } as any);
      const result = await service.handleVnpayCallback({ vnp_TxnRef: 'TS-001', vnp_ResponseCode: '00', vnp_Amount: '10000000', vnp_SecureHash: 'valid', vnp_TransactionNo: '123', vnp_BankCode: 'NCB' });
      expect(repository.markPaid).not.toHaveBeenCalled();
      expect(result.paymentStatus).toBe('paid');
    });

    it('should mark failed on error response code', async () => {
      repository.findByTransactionRef.mockResolvedValue(mockPayment as any);
      repository.markFailed.mockResolvedValue({ ...mockPayment, paymentStatus: 'failed' } as any);
      const result = await service.handleVnpayCallback({ vnp_TxnRef: 'TS-001', vnp_ResponseCode: '99', vnp_Amount: '10000000', vnp_SecureHash: 'valid', vnp_BankCode: 'NCB' });
      expect(repository.markFailed).toHaveBeenCalled();
      expect(result.paymentStatus).toBe('failed');
    });

    it('should not mark failed when already not pending', async () => {
      repository.findByTransactionRef.mockResolvedValue({ ...mockPayment, paymentStatus: 'failed' } as any);
      const result = await service.handleVnpayCallback({ vnp_TxnRef: 'TS-001', vnp_ResponseCode: '99', vnp_Amount: '10000000', vnp_SecureHash: 'valid', vnp_BankCode: 'NCB' });
      expect(repository.markFailed).not.toHaveBeenCalled();
    });

    it('should throw PAYMENT_VNPAY_CHECKSUM_INVALID when secure hash missing', async () => {
      verifySpy?.mockRestore();
      repository.findByTransactionRef.mockResolvedValue(mockPayment as any);
      await expect(service.handleVnpayCallback({ vnp_TxnRef: 'TS-001', vnp_ResponseCode: '00' })).rejects.toMatchObject({ response: { code: 'PAYMENT_VNPAY_CHECKSUM_INVALID' } });
    });

    it('should throw PAYMENT_AMOUNT_MISMATCH when amount does not match', async () => {
      repository.findByTransactionRef.mockResolvedValue(mockPayment as any);
      await expect(service.handleVnpayCallback({ vnp_TxnRef: 'TS-001', vnp_ResponseCode: '00', vnp_Amount: '5000000', vnp_SecureHash: 'valid' })).rejects.toMatchObject({ response: { code: 'PAYMENT_AMOUNT_MISMATCH' } });
    });

    it('should throw PAYMENT_NOT_FOUND when transaction ref missing', async () => {
      await expect(service.handleVnpayCallback({ vnp_ResponseCode: '00' })).rejects.toMatchObject({ response: { code: 'PAYMENT_NOT_FOUND' } });
    });
  });
});
