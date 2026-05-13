import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { DateRangeQueryDto, TopProductsQueryDto } from '@/modules/reports/dto/report.dto';
import { ReportService } from '@/modules/reports/services/report.service';

@ApiTags('reports')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Permissions({ module: 'report-analytics', action: 'view' })
@Controller('admin/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('revenue-summary')
  @ApiOperation({ summary: 'Get revenue summary' })
  @ApiOkResponse({ description: 'Revenue summary' })
  @ApiStandardErrors()
  revenueSummary(@Query() query: DateRangeQueryDto) { return this.reportService.revenueSummary(query); }

  @Get('order-summary')
  @ApiOperation({ summary: 'Get order status summary' })
  @ApiOkResponse({ description: 'Order status summary' })
  @ApiStandardErrors()
  orderSummary(@Query() query: DateRangeQueryDto) { return this.reportService.orderSummary(query); }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top products by paid revenue' })
  @ApiOkResponse({ description: 'Top products' })
  @ApiStandardErrors()
  topProducts(@Query() query: TopProductsQueryDto) { return this.reportService.topProducts(query); }
}
