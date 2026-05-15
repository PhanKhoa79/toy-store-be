import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { OrderRepository } from '../repositories/order.repository';
import { ApiException } from '@/common/exceptions/api.exception';

describe('OrderService', () => {
  let service: OrderService;
  let repository: jest.Mocked<OrderRepository>;

  const mockOrder = {
    id: 'order-id',
    orderCode: 'TS-001',
    userId: 'user-id',
    orderStatus: 'pending',
    paymentStatus: 'pending',
    totalAmount: 100000,
    items: [],
    payments: []
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: OrderRepository,
          useValue: {
            findCustomerOrders: jest.fn(),
            findByOrderCode: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(OrderRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listCustomerOrders', () => {
    it('should return customer orders', async () => {
      repository.findCustomerOrders.mockResolvedValue([mockOrder] as any);
      const result = await service.listCustomerOrders('user-id');
      expect(repository.findCustomerOrders).toHaveBeenCalledWith('user-id');
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('getCustomerOrder', () => {
    it('should return order when owned by customer', async () => {
      repository.findByOrderCode.mockResolvedValue(mockOrder as any);
      const result = await service.getCustomerOrder('user-id', 'TS-001');
      expect(result).toEqual(mockOrder);
    });

    it('should throw ORDER_NOT_FOUND when order does not exist', async () => {
      repository.findByOrderCode.mockResolvedValue(null);
      await expect(service.getCustomerOrder('user-id', 'TS-001')).rejects.toMatchObject({ response: { code: 'ORDER_NOT_FOUND' } });
    });

    it('should throw ORDER_NOT_OWNED_BY_CUSTOMER when order belongs to another user', async () => {
      repository.findByOrderCode.mockResolvedValue({ ...mockOrder, userId: 'other-id' } as any);
      await expect(service.getCustomerOrder('user-id', 'TS-001')).rejects.toMatchObject({ response: { code: 'ORDER_NOT_OWNED_BY_CUSTOMER' } });
    });
  });

  describe('cancelCustomerOrder', () => {
    it('should cancel pending unpaid order', async () => {
      repository.findByOrderCode.mockResolvedValue(mockOrder as any);
      repository.update.mockResolvedValue({ ...mockOrder, orderStatus: 'cancelled' } as any);
      const result = await service.cancelCustomerOrder('user-id', 'TS-001', { cancelledReason: 'Changed mind' });
      expect(repository.update).toHaveBeenCalledWith('order-id', { orderStatus: 'cancelled', cancelledReason: 'Changed mind' });
    });

    it('should throw ORDER_CANNOT_CANCEL when order is not pending', async () => {
      repository.findByOrderCode.mockResolvedValue({ ...mockOrder, orderStatus: 'confirmed' } as any);
      await expect(service.cancelCustomerOrder('user-id', 'TS-001', { cancelledReason: 'Test' })).rejects.toMatchObject({ response: { code: 'ORDER_CANNOT_CANCEL' } });
    });

    it('should throw ORDER_CANNOT_CANCEL when order is already paid', async () => {
      repository.findByOrderCode.mockResolvedValue({ ...mockOrder, paymentStatus: 'paid' } as any);
      await expect(service.cancelCustomerOrder('user-id', 'TS-001', { cancelledReason: 'Test' })).rejects.toMatchObject({ response: { code: 'ORDER_CANNOT_CANCEL' } });
    });
  });

  describe('listAdminOrders', () => {
    it('should return paginated orders with filters', async () => {
      repository.count.mockResolvedValue(1);
      repository.findMany.mockResolvedValue([mockOrder] as any);
      const result = await service.listAdminOrders({ page: 1, pageSize: 20, search: 'TS', orderStatus: 'pending', paymentStatus: 'pending', sortDirection: 'desc' } as any);
      expect(result.data).toEqual([mockOrder]);
      expect(result.meta).toBeDefined();
    });
  });

  describe('getAdminOrder', () => {
    it('should return order by id', async () => {
      repository.findById.mockResolvedValue(mockOrder as any);
      const result = await service.getAdminOrder('order-id');
      expect(result).toEqual(mockOrder);
    });

    it('should throw ORDER_NOT_FOUND when order does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getAdminOrder('order-id')).rejects.toMatchObject({ response: { code: 'ORDER_NOT_FOUND' } });
    });
  });

  describe('updateAdminOrderStatus', () => {
    it('should update status with valid transition', async () => {
      repository.findById.mockResolvedValue(mockOrder as any);
      repository.update.mockResolvedValue({ ...mockOrder, orderStatus: 'confirmed' } as any);
      const result = await service.updateAdminOrderStatus('order-id', { orderStatus: 'confirmed' });
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw ORDER_INVALID_STATUS_TRANSITION for invalid transition', async () => {
      repository.findById.mockResolvedValue({ ...mockOrder, orderStatus: 'pending' } as any);
      await expect(service.updateAdminOrderStatus('order-id', { orderStatus: 'delivered' })).rejects.toMatchObject({ response: { code: 'ORDER_INVALID_STATUS_TRANSITION' } });
    });

    it('should throw ORDER_INVALID_STATUS_TRANSITION when transitioning from delivered', async () => {
      repository.findById.mockResolvedValue({ ...mockOrder, orderStatus: 'delivered' } as any);
      await expect(service.updateAdminOrderStatus('order-id', { orderStatus: 'confirmed' })).rejects.toMatchObject({ response: { code: 'ORDER_INVALID_STATUS_TRANSITION' } });
    });

    it('should throw COMMON_VALIDATION_ERROR when cancelling without reason', async () => {
      repository.findById.mockResolvedValue(mockOrder as any);
      await expect(service.updateAdminOrderStatus('order-id', { orderStatus: 'cancelled' })).rejects.toMatchObject({ response: { code: 'COMMON_VALIDATION_ERROR' } });
    });

    it('should allow cancel with reason', async () => {
      repository.findById.mockResolvedValue(mockOrder as any);
      repository.update.mockResolvedValue({ ...mockOrder, orderStatus: 'cancelled' } as any);
      const result = await service.updateAdminOrderStatus('order-id', { orderStatus: 'cancelled', cancelledReason: 'Out of stock' });
      expect(repository.update).toHaveBeenCalledWith('order-id', { orderStatus: 'cancelled', cancelledReason: 'Out of stock' });
    });

    it('should enforce full state machine: pending -> confirmed -> processing -> shipping -> delivered', async () => {
      const transitions = [
        { current: 'pending', next: 'confirmed', valid: true },
        { current: 'pending', next: 'processing', valid: false },
        { current: 'pending', next: 'shipping', valid: false },
        { current: 'confirmed', next: 'processing', valid: true },
        { current: 'confirmed', next: 'delivered', valid: false },
        { current: 'processing', next: 'shipping', valid: true },
        { current: 'processing', next: 'confirmed', valid: false },
        { current: 'shipping', next: 'delivered', valid: true },
        { current: 'shipping', next: 'pending', valid: false },
        { current: 'delivered', next: 'cancelled', valid: false },
        { current: 'cancelled', next: 'pending', valid: false }
      ];

      for (const t of transitions) {
        repository.findById.mockResolvedValue({ ...mockOrder, orderStatus: t.current } as any);
        if (t.valid) {
          repository.update.mockResolvedValue({ ...mockOrder, orderStatus: t.next } as any);
          await expect(service.updateAdminOrderStatus('order-id', { orderStatus: t.next as any })).resolves.toBeDefined();
        } else {
          await expect(service.updateAdminOrderStatus('order-id', { orderStatus: t.next as any })).rejects.toMatchObject({ response: { code: 'ORDER_INVALID_STATUS_TRANSITION' } });
        }
      }
    });
  });
});
