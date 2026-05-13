import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { CurrentUser } from '@/common/contracts';
import { AdminListBlogsQueryDto, CreateBlogDto, UpdateBlogDto } from '@/modules/blogs/dto/blog-admin.dto';
import { BlogService } from '@/modules/blogs/services/blog.service';

@ApiTags('admin-blogs')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/blogs')
export class AdminBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @Permissions({ module: 'blog-management', action: 'view' })
  @ApiOperation({ summary: 'List admin blogs' })
  @ApiOkResponse({ description: 'Paginated blog list' })
  @ApiStandardErrors()
  list(@Query() query: AdminListBlogsQueryDto) {
    return this.blogService.listAdminBlogs(query);
  }

  @Post()
  @Permissions({ module: 'blog-management', action: 'create' })
  @ApiOperation({ summary: 'Create blog' })
  @ApiCreatedResponse({ description: 'Created blog' })
  @ApiStandardErrors()
  create(@Body() dto: CreateBlogDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.blogService.createBlog(dto, user);
  }

  @Get(':id')
  @Permissions({ module: 'blog-management', action: 'view' })
  @ApiOperation({ summary: 'Get admin blog detail' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Blog detail' })
  @ApiStandardErrors()
  get(@Param('id') id: string) {
    return this.blogService.getAdminBlogById(id);
  }

  @Patch(':id')
  @Permissions({ module: 'blog-management', action: 'update' })
  @ApiOperation({ summary: 'Update blog' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated blog' })
  @ApiStandardErrors()
  update(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    return this.blogService.updateBlog(id, dto);
  }

  @Patch(':id/publish')
  @Permissions({ module: 'blog-management', action: 'update' })
  @ApiOperation({ summary: 'Publish blog' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Published blog' })
  @ApiStandardErrors()
  publish(@Param('id') id: string) {
    return this.blogService.publishBlog(id);
  }

  @Patch(':id/archive')
  @Permissions({ module: 'blog-management', action: 'update' })
  @ApiOperation({ summary: 'Archive blog' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Archived blog' })
  @ApiStandardErrors()
  archive(@Param('id') id: string) {
    return this.blogService.archiveBlog(id);
  }

}
