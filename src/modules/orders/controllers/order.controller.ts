import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { CurrentUser } from '@/common/contracts';
import { CancelOrderDto } from '@/modules/orders/dto/order.dto';
import { OrderService } from '@/modules/orders/services/order.service';

@ApiTags('orders')
@ApiCookieAuth('access_token')
@Roles('customer')
@Controller('me/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'List current customer orders' })
  @ApiOkResponse({ description: 'Customer order list' })
  @ApiStandardErrors()
  list(@CurrentUserDecorator() user: CurrentUser) {
    return this.orderService.listCustomerOrders(user.id);
  }

  @Get(':orderCode')
  @ApiOperation({ summary: 'Get current customer order detail' })
  @ApiParam({ name: 'orderCode' })
  @ApiOkResponse({ description: 'Customer order detail' })
  @ApiStandardErrors()
  get(@CurrentUserDecorator() user: CurrentUser, @Param('orderCode') orderCode: string) {
    return this.orderService.getCustomerOrder(user.id, orderCode);
  }

  @Patch(':orderCode/cancel')
  @ApiOperation({ summary: 'Cancel current customer pending unpaid order' })
  @ApiParam({ name: 'orderCode' })
  @ApiOkResponse({ description: 'Cancelled order' })
  @ApiStandardErrors()
  cancel(@CurrentUserDecorator() user: CurrentUser, @Param('orderCode') orderCode: string, @Body() dto: CancelOrderDto) {
    return this.orderService.cancelCustomerOrder(user.id, orderCode, dto);
  }
}
