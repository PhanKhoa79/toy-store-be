import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { CurrentUser } from '@/common/contracts';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CreateReviewDto, PublicListReviewsQueryDto } from '@/modules/reviews/dto/review.dto';
import { ReviewService } from '@/modules/reviews/services/review.service';

@ApiTags('reviews')
@Controller('products/:productId/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List approved public product reviews' })
  @ApiParam({ name: 'productId' })
  @ApiOkResponse({ description: 'Approved product reviews' })
  @ApiStandardErrors()
  listPublicProductReviews(@Param('productId') productId: string, @Query() query: PublicListReviewsQueryDto) {
    return this.reviewService.listPublicProductReviews(productId, query);
  }

  @Post()
  @ApiCookieAuth('access_token')
  @Roles('customer')
  @ApiOperation({ summary: 'Create product review for delivered order item' })
  @ApiParam({ name: 'productId' })
  @ApiCreatedResponse({ description: 'Created pending review' })
  @ApiStandardErrors()
  createReview(@Param('productId') productId: string, @Body() dto: CreateReviewDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.reviewService.createReview(productId, dto, user);
  }
}
