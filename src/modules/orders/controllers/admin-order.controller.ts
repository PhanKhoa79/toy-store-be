import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminListOrdersQueryDto, UpdateOrderStatusDto } from '@/modules/orders/dto/order.dto';
import { OrderService } from '@/modules/orders/services/order.service';

@ApiTags('admin-orders')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions({ module: 'order-management', action: 'view' })
  @ApiOperation({ summary: 'List admin orders' })
  @ApiOkResponse({ description: 'Paginated order list' })
  @ApiStandardErrors()
  list(@Query() query: AdminListOrdersQueryDto) {
    return this.orderService.listAdminOrders(query);
  }

  @Get(':id')
  @Permissions({ module: 'order-management', action: 'view' })
  @ApiOperation({ summary: 'Get admin order detail' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Order detail' })
  @ApiStandardErrors()
  get(@Param('id') id: string) {
    return this.orderService.getAdminOrder(id);
  }

  @Patch(':id/status')
  @Permissions({ module: 'order-management', action: 'update' })
  @ApiOperation({ summary: 'Update admin order status' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated order' })
  @ApiStandardErrors()
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateAdminOrderStatus(id, dto);
  }
}
