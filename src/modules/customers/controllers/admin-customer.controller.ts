import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminListCustomersQueryDto } from '@/modules/customers/dto/customer-admin.dto';
import { CustomerService } from '@/modules/customers/services/customer.service';

@ApiTags('admin-customers')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/customers')
export class AdminCustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Permissions({ module: 'customer-management', action: 'view' })
  @ApiOperation({ summary: 'List admin customers' })
  @ApiOkResponse({ description: 'Paginated customer list' })
  @ApiStandardErrors()
  list(@Query() query: AdminListCustomersQueryDto) {
    return this.customerService.listAdminCustomers(query);
  }

  @Get(':id')
  @Permissions({ module: 'customer-management', action: 'view' })
  @ApiOperation({ summary: 'Get admin customer detail' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Customer detail' })
  @ApiStandardErrors()
  get(@Param('id') id: string) {
    return this.customerService.getAdminCustomer(id);
  }

  @Patch(':id/lock')
  @Permissions({ module: 'customer-management', action: 'update' })
  @ApiOperation({ summary: 'Lock customer' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Locked customer' })
  @ApiStandardErrors()
  lock(@Param('id') id: string) {
    return this.customerService.lockCustomer(id);
  }

  @Patch(':id/unlock')
  @Permissions({ module: 'customer-management', action: 'update' })
  @ApiOperation({ summary: 'Unlock customer' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Unlocked customer' })
  @ApiStandardErrors()
  unlock(@Param('id') id: string) {
    return this.customerService.unlockCustomer(id);
  }
}
