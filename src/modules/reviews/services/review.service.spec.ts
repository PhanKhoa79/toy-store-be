import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { ReviewRepository } from '../repositories/review.repository';
import { ApiException } from '@/common/exceptions/api.exception';

describe('ReviewService', () => {
  let service: ReviewService;
  let repository: jest.Mocked<ReviewRepository>;

  const mockReview = { id: 'rev-1', productId: 'p1', userId: 'u1', rating: 5, content: 'Great', status: 'approved' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: ReviewRepository,
          useValue: {
            countPublicByProduct: jest.fn(),
            findPublicByProduct: jest.fn(),
            findEligibleDeliveredOrder: jest.fn(),
            findUserProductOrderReview: jest.fn(),
            create: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    repository = module.get(ReviewRepository);
  });

  afterEach(() => jest.clearAllMocks());

  it('should list public reviews for product', async () => {
    repository.countPublicByProduct.mockResolvedValue(1);
    repository.findPublicByProduct.mockResolvedValue([mockReview] as any);
    const result = await service.listPublicProductReviews('p1', {} as any);
    expect(result.data).toHaveLength(1);
  });

  it('should create review when eligible', async () => {
    repository.findEligibleDeliveredOrder.mockResolvedValue({ id: 'order-1' } as any);
    repository.findUserProductOrderReview.mockResolvedValue(null);
    repository.create.mockResolvedValue(mockReview as any);
    const result = await service.createReview('p1', { orderId: 'order-1', rating: 5, content: 'Great' } as any, { id: 'u1', email: '', fullName: '', role: 'customer', isActive: true, permissions: [] });
    expect(repository.create).toHaveBeenCalled();
  });

  it('should throw REVIEW_NOT_ALLOWED when no eligible order', async () => {
    repository.findEligibleDeliveredOrder.mockResolvedValue(null);
    await expect(service.createReview('p1', { orderId: 'order-1', rating: 5, content: 'Great' } as any, { id: 'u1', email: '', fullName: '', role: 'customer', isActive: true, permissions: [] })).rejects.toMatchObject({ response: { code: 'REVIEW_NOT_ALLOWED' } });
  });

  it('should throw REVIEW_ALREADY_EXISTS when duplicate', async () => {
    repository.findEligibleDeliveredOrder.mockResolvedValue({ id: 'order-1' } as any);
    repository.findUserProductOrderReview.mockResolvedValue(mockReview as any);
    await expect(service.createReview('p1', { orderId: 'order-1', rating: 5, content: 'Great' } as any, { id: 'u1', email: '', fullName: '', role: 'customer', isActive: true, permissions: [] })).rejects.toMatchObject({ response: { code: 'REVIEW_ALREADY_EXISTS' } });
  });

  it('should update review status', async () => {
    repository.findById.mockResolvedValue(mockReview as any);
    repository.updateStatus.mockResolvedValue({ ...mockReview, status: 'rejected' } as any);
    const result = await service.updateReviewStatus('rev-1', { status: 'rejected', moderationNote: 'Spam' } as any, { id: 'admin-1', email: '', fullName: '', role: 'admin', isActive: true, permissions: [] });
    expect(result.status).toBe('rejected');
  });
});
