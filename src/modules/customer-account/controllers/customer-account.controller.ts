import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { CurrentUser } from '@/common/contracts';
import { AddWishlistItemDto, CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from '@/modules/customer-account/dto/customer-account.dto';
import { CustomerAccountService } from '@/modules/customer-account/services/customer-account.service';

@ApiCookieAuth('access_token')
@Roles('customer')
@ApiTags('customer-account')
@Controller()
export class CustomerAccountController {
  constructor(private readonly customerAccountService: CustomerAccountService) {}

  @Get('me/profile')
  @ApiOperation({ summary: 'Get current customer profile' })
  @ApiOkResponse({ description: 'Current customer profile' })
  @ApiStandardErrors()
  getProfile(@CurrentUserDecorator() user: CurrentUser) {
    return this.customerAccountService.getProfile(user.id);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current customer profile' })
  @ApiOkResponse({ description: 'Updated customer profile' })
  @ApiStandardErrors()
  updateProfile(@CurrentUserDecorator() user: CurrentUser, @Body() dto: UpdateProfileDto) {
    return this.customerAccountService.updateProfile(user.id, dto);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'List current customer addresses' })
  @ApiOkResponse({ description: 'Customer addresses' })
  @ApiStandardErrors()
  listAddresses(@CurrentUserDecorator() user: CurrentUser) {
    return this.customerAccountService.listAddresses(user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Create customer address' })
  @ApiCreatedResponse({ description: 'Created address' })
  @ApiStandardErrors()
  createAddress(@CurrentUserDecorator() user: CurrentUser, @Body() dto: CreateAddressDto) {
    return this.customerAccountService.createAddress(user.id, dto);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Update customer address' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated address' })
  @ApiStandardErrors()
  updateAddress(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.customerAccountService.updateAddress(user.id, id, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Delete customer address' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Deleted address' })
  @ApiStandardErrors()
  deleteAddress(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.customerAccountService.deleteAddress(user.id, id);
  }

  @Patch('me/addresses/:id/default')
  @ApiOperation({ summary: 'Set default customer address' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Default address updated' })
  @ApiStandardErrors()
  setDefaultAddress(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.customerAccountService.setDefaultAddress(user.id, id);
  }

  @Get('me/wishlist')
  @ApiOperation({ summary: 'List current customer wishlist' })
  @ApiOkResponse({ description: 'Wishlist items' })
  @ApiStandardErrors()
  listWishlist(@CurrentUserDecorator() user: CurrentUser) {
    return this.customerAccountService.listWishlist(user.id);
  }

  @Post('me/wishlist/items')
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiCreatedResponse({ description: 'Wishlist item added' })
  @ApiStandardErrors()
  addWishlistItem(@CurrentUserDecorator() user: CurrentUser, @Body() dto: AddWishlistItemDto) {
    return this.customerAccountService.addWishlistItem(user.id, dto);
  }

  @Delete('me/wishlist/items/:productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiParam({ name: 'productId' })
  @ApiOkResponse({ description: 'Wishlist item removed' })
  @ApiStandardErrors()
  removeWishlistItem(@CurrentUserDecorator() user: CurrentUser, @Param('productId') productId: string) {
    return this.customerAccountService.removeWishlistItem(user.id, productId);
  }
}
