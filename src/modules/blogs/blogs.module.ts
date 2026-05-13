import { Module } from '@nestjs/common';
import { AdminBlogController } from '@/modules/blogs/controllers/admin-blog.controller';
import { BlogController } from '@/modules/blogs/controllers/blog.controller';
import { BlogRepository } from '@/modules/blogs/repositories/blog.repository';
import { BlogService } from '@/modules/blogs/services/blog.service';

@Module({
  controllers: [BlogController, AdminBlogController],
  providers: [BlogService, BlogRepository],
  exports: [BlogService, BlogRepository]
})
export class BlogsModule {}
