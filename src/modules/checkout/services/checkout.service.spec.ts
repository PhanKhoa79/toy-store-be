import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '@/database/prisma.service';
import { PaymentService } from '@/modules/payments/services/payment.service';
import { ApiException } from '@/common/exceptions/api.exception';

describe('CheckoutService', () => {
  let service: CheckoutService;
  const mockPrisma = {
    cart: {
      findUnique: jest.fn() as jest.Mock
    },
    customerAddress: {
      findUnique: jest.fn() as jest.Mock
    },
    $transaction: jest.fn() as jest.Mock,
    order: { create: jest.fn() },
    product: { update: jest.fn() },
    cartItem: { deleteMany: jest.fn() }
  };
  const mockPaymentService = { buildVnpayPaymentUrl: jest.fn().mockReturnValue('https://vnpay.url') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentService, useValue: mockPaymentService }
      ]
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    jest.clearAllMocks();
  });

  it('should throw CART_EMPTY when cart has no items', async () => {
    mockPrisma.cart.findUnique.mockResolvedValue(null);
    await expect(service.checkout('user-id', { paymentMethod: 'vnpay' } as any)).rejects.toMatchObject({ response: { code: 'CART_EMPTY' } });
  });

  it('should throw CART_EMPTY when cart items empty', async () => {
    mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [] });
    await expect(service.checkout('user-id', { paymentMethod: 'vnpay' } as any)).rejects.toMatchObject({ response: { code: 'CART_EMPTY' } });
  });

  it('should throw CHECKOUT_SHIPPING_INVALID when addressId invalid', async () => {
    mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [{ productId: 'p1', quantity: 1, product: { status: 'active', stock: 10, price: 100000, salePrice: null, name: 'Product', sku: 'SKU1' } }] });
    mockPrisma.customerAddress.findUnique.mockResolvedValue(null);
    await expect(service.checkout('user-id', { paymentMethod: 'vnpay', addressId: 'bad-id' } as any)).rejects.toMatchObject({ response: { code: 'CHECKOUT_SHIPPING_INVALID' } });
  });

  it('should throw CHECKOUT_SHIPPING_INVALID when address belongs to other user', async () => {
    mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [{ productId: 'p1', quantity: 1, product: { status: 'active', stock: 10, price: 100000, salePrice: null, name: 'Product', sku: 'SKU1' } }] });
    mockPrisma.customerAddress.findUnique.mockResolvedValue({ userId: 'other-id' });
    await expect(service.checkout('user-id', { paymentMethod: 'vnpay', addressId: 'addr-1' } as any)).rejects.toMatchObject({ response: { code: 'CHECKOUT_SHIPPING_INVALID' } });
  });

  it('should throw CHECKOUT_SHIPPING_INVALID when manual shipping info missing', async () => {
    mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [{ productId: 'p1', quantity: 1, product: { status: 'active', stock: 10, price: 100000, salePrice: null, name: 'Product', sku: 'SKU1' } }] });
    await expect(service.checkout('user-id', { paymentMethod: 'vnpay' } as any)).rejects.toMatchObject({ response: { code: 'CHECKOUT_SHIPPING_INVALID' } });
  });

  it('should throw CART_PRODUCT_UNAVAILABLE when product inactive', async () => {
    mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [{ productId: 'p1', quantity: 1, product: { status: 'inactive', stock: 10, price: 100000, salePrice: null, name: 'Product', sku: 'SKU1' } }] });
    await expect(service.checkout('user-id', { paymentMethod: 'vnpay', recipientName: 'A', recipientPhone: '090', shippingAddress: '123' } as any)).rejects.toMatchObject({ response: { code: 'CART_PRODUCT_UNAVAILABLE' } });
  });

  it('should throw CART_STOCK_EXCEEDED when quantity > stock', async () => {
    mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [{ productId: 'p1', quantity: 20, product: { status: 'active', stock: 10, price: 100000, salePrice: null, name: 'Product', sku: 'SKU1' } }] });
    await expect(service.checkout('user-id', { paymentMethod: 'vnpay', recipientName: 'A', recipientPhone: '090', shippingAddress: '123' } as any)).rejects.toMatchObject({ response: { code: 'CART_STOCK_EXCEEDED' } });
  });

  it('should create order and payment URL successfully', async () => {
    mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', userId: 'user-id', items: [{ productId: 'p1', quantity: 1, product: { status: 'active', stock: 10, price: 100000, salePrice: 90000, name: 'Product', sku: 'SKU1' } }] });
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = { order: { create: jest.fn().mockResolvedValue({ id: 'order-1', orderCode: 'TS-123', payments: [{ id: 'pay-1' }], items: [] }) }, product: { update: jest.fn() }, cartItem: { deleteMany: jest.fn() } };
      return cb(tx);
    });
    const result = await service.checkout('user-id', { paymentMethod: 'vnpay', recipientName: 'A', recipientPhone: '090', shippingAddress: '123' } as any);
    expect(result.order).toBeDefined();
    expect(result.paymentUrl).toBe('https://vnpay.url');
  });
});
