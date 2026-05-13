import { Body, Controller, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { CurrentUser } from '@/common/contracts';
import { CheckoutDto } from '@/modules/checkout/dto/checkout.dto';
import { CheckoutService } from '@/modules/checkout/services/checkout.service';

@ApiTags('checkout')
@ApiCookieAuth('access_token')
@Roles('customer')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'Create order and VNPAY payment URL from cart' })
  @ApiCreatedResponse({ description: 'Checkout result with order and paymentUrl' })
  @ApiStandardErrors()
  checkout(@CurrentUserDecorator() user: CurrentUser, @Body() dto: CheckoutDto) {
    return this.checkoutService.checkout(user.id, dto);
  }
}
