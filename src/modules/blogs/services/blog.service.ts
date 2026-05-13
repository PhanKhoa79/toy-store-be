import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import type { CurrentUser } from '@/common/contracts';
import { AdminListBlogsQueryDto, CreateBlogDto, UpdateBlogDto } from '@/modules/blogs/dto/blog-admin.dto';
import { BlogRepository } from '@/modules/blogs/repositories/blog.repository';

@Injectable()
export class BlogService {
  constructor(private readonly blogRepository: BlogRepository) {}

  listPublicBlogs() {
    return this.blogRepository.findPublishedMany();
  }

  async getPublicBlogBySlug(slug: string) {
    const blog = await this.blogRepository.findPublishedBySlug(slug);
    if (!blog) throw new ApiException('BLOG_NOT_FOUND', 'Không tìm thấy bài viết.', HttpStatus.NOT_FOUND);
    return blog;
  }

  async listAdminBlogs(query: AdminListBlogsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.BlogPostWhereInput = {};
    if (query.search) where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }];
    if (query.status) where.status = query.status;
    const orderBy: Prisma.BlogPostOrderByWithRelationInput = { [query.sortBy ?? 'updatedAt']: query.sortDirection ?? 'desc' };
    const [total, blogs] = await Promise.all([this.blogRepository.count(where), this.blogRepository.findMany(where, page, pageSize, orderBy)]);
    return { data: blogs, meta: createPaginationMeta(page, pageSize, total) };
  }

  async getAdminBlogById(id: string) {
    const blog = await this.blogRepository.findById(id);
    if (!blog) throw new ApiException('BLOG_NOT_FOUND', 'Không tìm thấy bài viết.', HttpStatus.NOT_FOUND);
    return blog;
  }

  async createBlog(dto: CreateBlogDto, user: CurrentUser) {
    await this.validateUniqueSlug(dto.slug);
    return this.blogRepository.create({
      title: dto.title,
      slug: dto.slug,
      excerpt: dto.excerpt,
      content: dto.content,
      thumbnailUrl: dto.thumbnailUrl,
      status: dto.status ?? 'draft',
      publishedAt: dto.status === 'published' ? new Date() : null,
      author: { connect: { id: user.id } }
    });
  }

  async updateBlog(id: string, dto: UpdateBlogDto) {
    const existing = await this.blogRepository.findById(id);
    if (!existing) throw new ApiException('BLOG_NOT_FOUND', 'Không tìm thấy bài viết.', HttpStatus.NOT_FOUND);
    if (dto.slug) await this.validateUniqueSlug(dto.slug, id);
    const nextStatus = dto.status ?? existing.status;
    return this.blogRepository.update(id, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.thumbnailUrl !== undefined ? { thumbnailUrl: dto.thumbnailUrl } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(nextStatus === 'published' && !existing.publishedAt ? { publishedAt: new Date() } : {})
    });
  }

  async publishBlog(id: string) {
    const existing = await this.blogRepository.findById(id);
    if (!existing) throw new ApiException('BLOG_NOT_FOUND', 'Không tìm thấy bài viết.', HttpStatus.NOT_FOUND);
    return this.blogRepository.update(id, { status: 'published', publishedAt: existing.publishedAt ?? new Date() });
  }

  async archiveBlog(id: string) {
    const existing = await this.blogRepository.findById(id);
    if (!existing) throw new ApiException('BLOG_NOT_FOUND', 'Không tìm thấy bài viết.', HttpStatus.NOT_FOUND);
    return this.blogRepository.update(id, { status: 'archived' });
  }

  private async validateUniqueSlug(slug: string, excludedId?: string) {
    const existing = await this.blogRepository.findBySlug(slug);
    if (existing && existing.id !== excludedId) throw new ApiException('BLOG_SLUG_ALREADY_EXISTS', 'Slug bài viết đã tồn tại.', HttpStatus.CONFLICT);
  }
}
