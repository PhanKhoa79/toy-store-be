import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminUserListQueryDto, CreateAdminUserDto, UpdateAdminUserDto, UpdateUserPermissionsDto } from '@/modules/users/dto/admin-user.dto';
import { UserService } from '@/modules/users/services/user.service';

@ApiTags('admin-users')
@ApiCookieAuth('access_token')
@Roles('admin')
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List staff/admin users' })
  @ApiOkResponse({ description: 'Paginated admin user list' })
  @ApiStandardErrors()
  list(@Query() query: AdminUserListQueryDto) { return this.userService.listUsers(query); }

  @Post()
  @ApiOperation({ summary: 'Create staff/admin user' })
  @ApiCreatedResponse({ description: 'Created staff/admin user' })
  @ApiStandardErrors()
  create(@Body() dto: CreateAdminUserDto) { return this.userService.createUser(dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff/admin user detail' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'User detail with permissions' })
  @ApiStandardErrors()
  get(@Param('id') id: string) { return this.userService.getUser(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff/admin user' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated user' })
  @ApiStandardErrors()
  update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) { return this.userService.updateUser(id, dto); }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Update staff permissions' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated user permissions' })
  @ApiStandardErrors()
  updatePermissions(@Param('id') id: string, @Body() dto: UpdateUserPermissionsDto) { return this.userService.updatePermissions(id, dto); }
}
