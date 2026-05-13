import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { BlogService } from '@/modules/blogs/services/blog.service';

@Public()
@ApiTags('blogs')
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: 'List published public blogs' })
  @ApiOkResponse({ description: 'Published blog list' })
  listPublicBlogs() {
    return this.blogService.listPublicBlogs();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published public blog by slug' })
  @ApiParam({ name: 'slug', example: 'chon-do-choi-an-toan-cho-be' })
  @ApiOkResponse({ description: 'Blog detail' })
  getPublicBlogBySlug(@Param('slug') slug: string) {
    return this.blogService.getPublicBlogBySlug(slug);
  }
}
