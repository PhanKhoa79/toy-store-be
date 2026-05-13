import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.BlogPostWhereInput) {
    return this.prisma.blogPost.count({ where });
  }

  findMany(where: Prisma.BlogPostWhereInput, page: number, pageSize: number, orderBy: Prisma.BlogPostOrderByWithRelationInput) {
    return this.prisma.blogPost.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { author: { select: { id: true, fullName: true } } } });
  }

  findPublishedMany() {
    return this.prisma.blogPost.findMany({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, select: { id: true, title: true, slug: true, excerpt: true, thumbnailUrl: true, publishedAt: true } });
  }

  findPublishedBySlug(slug: string) {
    return this.prisma.blogPost.findFirst({ where: { slug, status: 'published' }, include: { author: { select: { id: true, fullName: true } } } });
  }

  findBySlug(slug: string) {
    return this.prisma.blogPost.findUnique({ where: { slug } });
  }

  findById(id: string) {
    return this.prisma.blogPost.findUnique({ where: { id }, include: { author: { select: { id: true, fullName: true } } } });
  }

  create(data: Prisma.BlogPostCreateInput) {
    return this.prisma.blogPost.create({ data, include: { author: { select: { id: true, fullName: true } } } });
  }

  update(id: string, data: Prisma.BlogPostUpdateInput) {
    return this.prisma.blogPost.update({ where: { id }, data, include: { author: { select: { id: true, fullName: true } } } });
  }
}
