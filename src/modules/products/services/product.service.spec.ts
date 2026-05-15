import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { ProductRepository } from '../repositories/product.repository';
import { ProductMapper } from '../mappers/product.mapper';
import { ApiException } from '@/common/exceptions/api.exception';

describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<ProductRepository>;
  let mapper: jest.Mocked<ProductMapper>;

  const mockProduct = { id: 'p1', name: 'Product', slug: 'product', sku: 'SKU001', status: 'active', price: 100000, salePrice: 90000, stock: 10, brand: {}, category: {} };
  const mockDto = { id: 'p1', name: 'Product', price: 100000, salePrice: 90000, status: 'active', stock: 10, brand: {}, category: {} };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            count: jest.fn(),
            findMany: jest.fn(),
            findActiveBySlug: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findBySku: jest.fn(),
            findBrandById: jest.fn(),
            findCategoryById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            disable: jest.fn()
          }
        },
        {
          provide: ProductMapper,
          useValue: {
            toDto: jest.fn().mockReturnValue(mockDto)
          }
        }
      ]
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get(ProductRepository);
    mapper = module.get(ProductMapper);
  });

  afterEach(() => jest.clearAllMocks());

  it('should list products with filters', async () => {
    repository.count.mockResolvedValue(1);
    repository.findMany.mockResolvedValue([mockProduct] as any);
    const result = await service.listProducts({} as any);
    expect(result.data).toHaveLength(1);
    expect(result.meta).toBeDefined();
  });

  it('should throw PRODUCT_NOT_FOUND for inactive slug', async () => {
    repository.findActiveBySlug.mockResolvedValue(null);
    await expect(service.getProductBySlug('missing')).rejects.toMatchObject({ response: { code: 'PRODUCT_NOT_FOUND' } });
  });

  it('should validate unique slug on create', async () => {
    repository.findBrandById.mockResolvedValue({ id: 'b1', status: 'active' } as any);
    repository.findCategoryById.mockResolvedValue({ id: 'c1', status: 'active' } as any);
    repository.findBySlug.mockResolvedValue(mockProduct as any);
    await expect(service.createProduct({ slug: 'product', sku: 'SKU002', name: 'New', price: 100000, brandId: 'b1', categoryId: 'c1', stock: 10, status: 'active' } as any)).rejects.toMatchObject({ response: { code: 'PRODUCT_SLUG_ALREADY_EXISTS' } });
  });

  it('should validate price: salePrice must <= price', async () => {
    repository.findBrandById.mockResolvedValue({ id: 'b1', status: 'active' } as any);
    repository.findCategoryById.mockResolvedValue({ id: 'c1', status: 'active' } as any);
    repository.findBySlug.mockResolvedValue(null);
    repository.findBySku.mockResolvedValue(null);
    await expect(service.createProduct({ slug: 'new', sku: 'SKU002', name: 'New', price: 100000, salePrice: 150000, brandId: 'b1', categoryId: 'c1', stock: 10, status: 'active' } as any)).rejects.toMatchObject({ response: { code: 'PRODUCT_INVALID_PRICE' } });
  });

  it('should throw BRAND_NOT_FOUND for invalid brand', async () => {
    repository.findBrandById.mockResolvedValue(null);
    await expect(service.createProduct({ slug: 'new', sku: 'SKU002', name: 'New', price: 100000, brandId: 'b1', categoryId: 'c1', stock: 10, status: 'active' } as any)).rejects.toMatchObject({ response: { code: 'BRAND_NOT_FOUND' } });
  });
});
