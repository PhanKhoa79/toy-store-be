import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { PaymentService } from '@/modules/payments/services/payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Get('result')
  @ApiOperation({ summary: 'Get FE-readable VNPAY payment result summary' })
  @ApiOkResponse({ description: 'Payment result summary' })
  @ApiStandardErrors()
  getPaymentResult(@Query() query: Record<string, string | undefined>) {
    return this.paymentService.getPaymentResult(query);
  }

  @Public()
  @Get('result/summary')
  @ApiOperation({ summary: 'Get FE-readable VNPAY payment result summary' })
  @ApiOkResponse({ description: 'Payment result summary' })
  @ApiStandardErrors()
  getPaymentResultSummary(@Query() query: Record<string, string | undefined>) {
    return this.paymentService.getPaymentResult(query);
  }

  @Public()
  @Get('vnpay/return')
  @ApiOperation({ summary: 'Handle VNPAY return callback' })
  @ApiOkResponse({ description: 'VNPAY return result' })
  @ApiStandardErrors()
  vnpayReturn(@Query() query: Record<string, string | undefined>) {
    return this.paymentService.handleVnpayCallback(query);
  }

  @Public()
  @Post('vnpay/ipn')
  @ApiOperation({ summary: 'Handle VNPAY IPN callback' })
  @ApiOkResponse({ description: 'VNPAY IPN result' })
  @ApiStandardErrors()
  vnpayIpn(@Query() query: Record<string, string | undefined>) {
    return this.paymentService.handleVnpayCallback(query);
  }

  @Public()
  @Get('vnpay/ipn')
  @ApiOperation({ summary: 'Handle VNPAY IPN callback' })
  @ApiOkResponse({ description: 'VNPAY IPN result' })
  @ApiStandardErrors()
  vnpayIpnGet(@Query() query: Record<string, string | undefined>) {
    return this.paymentService.handleVnpayCallback(query);
  }

  @Get(':paymentId')
  @ApiCookieAuth('access_token')
  @Roles('customer')
  @ApiOperation({ summary: 'Get payment detail' })
  @ApiParam({ name: 'paymentId' })
  @ApiOkResponse({ description: 'Payment detail' })
  @ApiStandardErrors()
  getPayment(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPayment(paymentId);
  }
}
