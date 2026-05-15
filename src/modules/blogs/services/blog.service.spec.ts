import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';
import { BlogRepository } from '../repositories/blog.repository';
import { ApiException } from '@/common/exceptions/api.exception';

describe('BlogService', () => {
  let service: BlogService;
  let repository: jest.Mocked<BlogRepository>;

  const mockBlog = { id: 'blog-1', title: 'Blog', slug: 'blog', status: 'published', content: 'Content', excerpt: 'Excerpt', publishedAt: new Date() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: BlogRepository,
          useValue: {
            findPublishedMany: jest.fn(),
            findPublishedBySlug: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<BlogService>(BlogService);
    repository = module.get(BlogRepository);
  });

  afterEach(() => jest.clearAllMocks());

  it('should list public published blogs', async () => {
    repository.findPublishedMany.mockResolvedValue([mockBlog] as any);
    const result = await service.listPublicBlogs();
    expect(result).toHaveLength(1);
  });

  it('should throw BLOG_NOT_FOUND for unpublished slug', async () => {
    repository.findPublishedBySlug.mockResolvedValue(null);
    await expect(service.getPublicBlogBySlug('missing')).rejects.toMatchObject({ response: { code: 'BLOG_NOT_FOUND' } });
  });

  it('should create blog with unique slug', async () => {
    repository.findBySlug.mockResolvedValue(null);
    repository.create.mockResolvedValue(mockBlog as any);
    const result = await service.createBlog({ title: 'Blog', slug: 'blog', excerpt: 'Excerpt', content: 'Content', status: 'published' } as any, { id: 'user-id', email: '', fullName: '', role: 'admin', isActive: true, permissions: [] });
    expect(repository.create).toHaveBeenCalled();
  });

  it('should throw BLOG_SLUG_ALREADY_EXISTS for duplicate slug', async () => {
    repository.findBySlug.mockResolvedValue(mockBlog as any);
    await expect(service.createBlog({ title: 'Blog', slug: 'blog', excerpt: 'Excerpt', content: 'Content' } as any, { id: 'user-id', email: '', fullName: '', role: 'admin', isActive: true, permissions: [] })).rejects.toMatchObject({ response: { code: 'BLOG_SLUG_ALREADY_EXISTS' } });
  });

  it('should publish blog', async () => {
    repository.findById.mockResolvedValue({ ...mockBlog, status: 'draft', publishedAt: null } as any);
    repository.update.mockResolvedValue({ ...mockBlog, status: 'published' } as any);
    const result = await service.publishBlog('blog-1');
    expect(result.status).toBe('published');
  });

  it('should archive blog', async () => {
    repository.findById.mockResolvedValue(mockBlog as any);
    repository.update.mockResolvedValue({ ...mockBlog, status: 'archived' } as any);
    const result = await service.archiveBlog('blog-1');
    expect(result.status).toBe('archived');
  });
});
