import { Module } from '@nestjs/common';
import { AdminReviewController } from '@/modules/reviews/controllers/admin-review.controller';
import { ReviewController } from '@/modules/reviews/controllers/review.controller';
import { ReviewRepository } from '@/modules/reviews/repositories/review.repository';
import { ReviewService } from '@/modules/reviews/services/review.service';

@Module({
  controllers: [ReviewController, AdminReviewController],
  providers: [ReviewService, ReviewRepository],
  exports: [ReviewService, ReviewRepository]
})
export class ReviewsModule {}
