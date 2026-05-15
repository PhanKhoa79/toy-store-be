import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '@/database/prisma.service';

describe('ReportService', () => {
  let service: ReportService;
  const mockPrisma = {
    order: { findMany: jest.fn() as jest.Mock, groupBy: jest.fn() as jest.Mock },
    orderItem: { groupBy: jest.fn() as jest.Mock }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();

    service = module.get<ReportService>(ReportService);
    jest.clearAllMocks();
  });

  it('should calculate revenue summary for paid orders', async () => {
    mockPrisma.order.findMany.mockResolvedValue([{ totalAmount: 100000 }, { totalAmount: 200000 }]);
    const result = await service.revenueSummary({ fromDate: '2024-01-01', toDate: '2024-01-31' });
    expect(result.totalRevenue).toBe(300000);
    expect(result.paidOrderCount).toBe(2);
    expect(result.averageOrderValue).toBe(150000);
  });

  it('should return zero when no paid orders', async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);
    const result = await service.revenueSummary({});
    expect(result.totalRevenue).toBe(0);
    expect(result.averageOrderValue).toBe(0);
  });

  it('should group order summary by status', async () => {
    mockPrisma.order.groupBy.mockResolvedValue([{ orderStatus: 'pending', _count: { _all: 3 } }]);
    const result = await service.orderSummary({});
    expect(result).toEqual([{ orderStatus: 'pending', count: 3 }]);
  });

  it('should return top products by revenue', async () => {
    mockPrisma.orderItem.groupBy.mockResolvedValue([
      { productId: 'p1', productName: 'Product 1', productSku: 'SKU1', _sum: { quantity: 2, lineTotal: 200000 } }
    ]);
    const result = await service.topProducts({ limit: 5 });
    expect(result[0].revenue).toBe(200000);
    expect(result[0].quantitySold).toBe(2);
  });
});
