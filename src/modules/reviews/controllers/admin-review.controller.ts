import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { CurrentUser } from '@/common/contracts';
import { AdminListReviewsQueryDto, UpdateReviewStatusDto } from '@/modules/reviews/dto/review.dto';
import { ReviewService } from '@/modules/reviews/services/review.service';

@ApiTags('admin-reviews')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/reviews')
export class AdminReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @Permissions({ module: 'review-comment', action: 'view' })
  @ApiOperation({ summary: 'List admin reviews' })
  @ApiOkResponse({ description: 'Paginated review list' })
  @ApiStandardErrors()
  list(@Query() query: AdminListReviewsQueryDto) {
    return this.reviewService.listAdminReviews(query);
  }

  @Patch(':id/status')
  @Permissions({ module: 'review-comment', action: 'approve' })
  @ApiOperation({ summary: 'Update review moderation status' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated review' })
  @ApiStandardErrors()
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.reviewService.updateReviewStatus(id, dto, user);
  }
}
