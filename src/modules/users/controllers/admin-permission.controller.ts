import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserService } from '@/modules/users/services/user.service';

@ApiTags('admin-permissions')
@ApiCookieAuth('access_token')
@Roles('admin')
@Controller('admin/permissions')
export class AdminPermissionController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List permission catalog for permission tree UI' })
  @ApiOkResponse({ description: 'Permission catalog' })
  @ApiStandardErrors()
  listPermissions() { return this.userService.listPermissions(); }
}
