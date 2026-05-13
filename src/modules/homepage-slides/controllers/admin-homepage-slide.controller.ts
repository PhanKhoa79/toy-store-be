import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminListHomepageSlidesQueryDto, CreateHomepageSlideDto, UpdateHomepageSlideDto } from '@/modules/homepage-slides/dto/homepage-slide-admin.dto';
import { HomepageSlideService } from '@/modules/homepage-slides/services/homepage-slide.service';

@ApiTags('admin-homepage-slides')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/homepage-slides')
export class AdminHomepageSlideController {
  constructor(private readonly homepageSlideService: HomepageSlideService) {}

  @Get()
  @Permissions({ module: 'homepage-slide', action: 'view' })
  @ApiOperation({ summary: 'List admin homepage slides' })
  @ApiOkResponse({ description: 'Paginated homepage slide list' })
  @ApiStandardErrors()
  list(@Query() query: AdminListHomepageSlidesQueryDto) {
    return this.homepageSlideService.listAdminSlides(query);
  }

  @Post()
  @Permissions({ module: 'homepage-slide', action: 'create' })
  @ApiOperation({ summary: 'Create homepage slide' })
  @ApiCreatedResponse({ description: 'Created homepage slide' })
  @ApiStandardErrors()
  create(@Body() dto: CreateHomepageSlideDto) {
    return this.homepageSlideService.createSlide(dto);
  }

  @Get(':id')
  @Permissions({ module: 'homepage-slide', action: 'view' })
  @ApiOperation({ summary: 'Get admin homepage slide detail' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Homepage slide detail' })
  @ApiStandardErrors()
  get(@Param('id') id: string) {
    return this.homepageSlideService.getAdminSlideById(id);
  }

  @Patch(':id')
  @Permissions({ module: 'homepage-slide', action: 'update' })
  @ApiOperation({ summary: 'Update homepage slide' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated homepage slide' })
  @ApiStandardErrors()
  update(@Param('id') id: string, @Body() dto: UpdateHomepageSlideDto) {
    return this.homepageSlideService.updateSlide(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: 'homepage-slide', action: 'delete' })
  @ApiOperation({ summary: 'Disable homepage slide' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Disabled homepage slide' })
  @ApiStandardErrors()
  disable(@Param('id') id: string) {
    return this.homepageSlideService.disableSlide(id);
  }
}
