import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import type { CurrentUser } from '@/common/contracts';
import { AdminListReviewsQueryDto, CreateReviewDto, PublicListReviewsQueryDto, UpdateReviewStatusDto } from '@/modules/reviews/dto/review.dto';
import { ReviewRepository } from '@/modules/reviews/repositories/review.repository';

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async listPublicProductReviews(productId: string, query: PublicListReviewsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [total, reviews] = await Promise.all([
      this.reviewRepository.countPublicByProduct(productId),
      this.reviewRepository.findPublicByProduct(productId, page, pageSize)
    ]);
    return { data: reviews, meta: createPaginationMeta(page, pageSize, total) };
  }

  async createReview(productId: string, dto: CreateReviewDto, user: CurrentUser) {
    const eligibleOrder = await this.reviewRepository.findEligibleDeliveredOrder(user.id, productId, dto.orderId);
    if (!eligibleOrder) throw new ApiException('REVIEW_NOT_ALLOWED', 'Bạn chưa đủ điều kiện đánh giá sản phẩm này.', HttpStatus.FORBIDDEN);

    const existing = await this.reviewRepository.findUserProductOrderReview(user.id, productId, dto.orderId);
    if (existing) throw new ApiException('REVIEW_ALREADY_EXISTS', 'Bạn đã đánh giá sản phẩm này.', HttpStatus.CONFLICT);

    return this.reviewRepository.create({
      product: { connect: { id: productId } },
      user: { connect: { id: user.id } },
      order: { connect: { id: dto.orderId } },
      rating: dto.rating,
      content: dto.content,
      status: 'pending'
    });
  }

  async listAdminReviews(query: AdminListReviewsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ReviewWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.productId) where.productId = query.productId;
    if (query.userId) where.userId = query.userId;
    const [total, reviews] = await Promise.all([
      this.reviewRepository.count(where),
      this.reviewRepository.findMany(where, page, pageSize, { createdAt: query.sortDirection ?? 'desc' })
    ]);
    return { data: reviews, meta: createPaginationMeta(page, pageSize, total) };
  }

  async updateReviewStatus(id: string, dto: UpdateReviewStatusDto, user: CurrentUser) {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new ApiException('REVIEW_NOT_FOUND', 'Không tìm thấy đánh giá.', HttpStatus.NOT_FOUND);
    return this.reviewRepository.updateStatus(id, {
      status: dto.status,
      moderationNote: dto.moderationNote,
      moderatedAt: new Date(),
      moderator: { connect: { id: user.id } }
    });
  }
}
