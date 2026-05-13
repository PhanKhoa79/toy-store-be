import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { CurrentUser } from '@/common/contracts';
import { AddCartItemDto, UpdateCartItemDto } from '@/modules/cart/dto/cart.dto';
import { CartService } from '@/modules/cart/services/cart.service';

@ApiTags('cart')
@ApiCookieAuth('access_token')
@Roles('customer')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current customer cart' })
  @ApiOkResponse({ description: 'Current cart' })
  @ApiStandardErrors()
  getCart(@CurrentUserDecorator() user: CurrentUser) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product to cart' })
  @ApiCreatedResponse({ description: 'Cart item added' })
  @ApiStandardErrors()
  addItem(@CurrentUserDecorator() user: CurrentUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:cartItemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'cartItemId' })
  @ApiOkResponse({ description: 'Cart item updated' })
  @ApiStandardErrors()
  updateItem(@CurrentUserDecorator() user: CurrentUser, @Param('cartItemId') cartItemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(user.id, cartItemId, dto);
  }

  @Delete('items/:cartItemId')
  @ApiOperation({ summary: 'Remove cart item' })
  @ApiParam({ name: 'cartItemId' })
  @ApiOkResponse({ description: 'Cart item removed' })
  @ApiStandardErrors()
  removeItem(@CurrentUserDecorator() user: CurrentUser, @Param('cartItemId') cartItemId: string) {
    return this.cartService.removeItem(user.id, cartItemId);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate current cart before checkout' })
  @ApiOkResponse({ description: 'Validated cart' })
  @ApiStandardErrors()
  validateCart(@CurrentUserDecorator() user: CurrentUser) {
    return this.cartService.validateCart(user.id);
  }
}
