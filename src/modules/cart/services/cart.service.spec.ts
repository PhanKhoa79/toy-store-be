import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { CartRepository } from '../repositories/cart.repository';
import { ProductMapper } from '@/modules/products/mappers/product.mapper';
import { ApiException } from '@/common/exceptions/api.exception';

describe('CartService', () => {
  let service: CartService;
  let repository: jest.Mocked<CartRepository>;
  let productMapper: jest.Mocked<ProductMapper>;

  const mockProduct = {
    id: 'product-id',
    name: 'Product',
    status: 'active',
    stock: 10,
    price: 100000,
    salePrice: 90000,
    brand: { id: 'b1', name: 'Brand', slug: 'brand', logoUrl: '', description: '', status: 'active', displayOrder: 1 },
    category: { id: 'c1', name: 'Cat', slug: 'cat', description: '', status: 'active', displayOrder: 1 }
  };

  const mockCart = {
    id: 'cart-id',
    userId: 'user-id',
    items: [{ id: 'item-id', cartId: 'cart-id', productId: 'product-id', quantity: 2, product: mockProduct }]
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: {
            getOrCreateCart: jest.fn(),
            findProduct: jest.fn(),
            addItem: jest.fn(),
            findCartItem: jest.fn(),
            updateItem: jest.fn(),
            removeItem: jest.fn()
          }
        },
        {
          provide: ProductMapper,
          useValue: {
            toDto: jest.fn().mockReturnValue({ id: 'product-id', name: 'Product', price: 100000, salePrice: 90000, status: 'active', stock: 10, brand: {}, category: {} })
          }
        }
      ]
    }).compile();

    service = module.get<CartService>(CartService);
    repository = module.get(CartRepository);
    productMapper = module.get(ProductMapper);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getCart', () => {
    it('should return cart with items', async () => {
      repository.getOrCreateCart.mockResolvedValue(mockCart as any);
      const result = await service.getCart('user-id');
      expect(result.items).toHaveLength(1);
      expect(result.subtotalAmount).toBe(180000);
    });

    it('should return empty cart when no items', async () => {
      repository.getOrCreateCart.mockResolvedValue({ id: 'cart-id', items: [] } as any);
      const result = await service.getCart('user-id');
      expect(result.items).toHaveLength(0);
      expect(result.subtotalAmount).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add product to cart', async () => {
      repository.findProduct.mockResolvedValue(mockProduct as any);
      repository.addItem.mockResolvedValue(mockCart as any);
      const result = await service.addItem('user-id', { productId: 'product-id', quantity: 1 });
      expect(repository.addItem).toHaveBeenCalledWith('user-id', 'product-id', 1);
    });

    it('should throw CART_PRODUCT_UNAVAILABLE when product is inactive', async () => {
      repository.findProduct.mockResolvedValue({ ...mockProduct, status: 'inactive' } as any);
      await expect(service.addItem('user-id', { productId: 'product-id', quantity: 1 })).rejects.toMatchObject({ response: { code: 'CART_PRODUCT_UNAVAILABLE' } });
    });

    it('should throw PRODUCT_OUT_OF_STOCK when stock is 0', async () => {
      repository.findProduct.mockResolvedValue({ ...mockProduct, stock: 0 } as any);
      await expect(service.addItem('user-id', { productId: 'product-id', quantity: 1 })).rejects.toMatchObject({ response: { code: 'PRODUCT_OUT_OF_STOCK' } });
    });

    it('should throw CART_STOCK_EXCEEDED when quantity > stock', async () => {
      repository.findProduct.mockResolvedValue(mockProduct as any);
      await expect(service.addItem('user-id', { productId: 'product-id', quantity: 20 })).rejects.toMatchObject({ response: { code: 'CART_STOCK_EXCEEDED' } });
    });
  });

  describe('updateItem', () => {
    it('should update item quantity', async () => {
      repository.findCartItem.mockResolvedValue({ id: 'item-id', cart: { userId: 'user-id' }, product: mockProduct } as any);
      repository.updateItem.mockResolvedValue(mockCart as any);
      const result = await service.updateItem('user-id', 'item-id', { quantity: 3 });
      expect(repository.updateItem).toHaveBeenCalledWith('item-id', 3);
    });

    it('should throw CART_ITEM_NOT_FOUND when item does not exist', async () => {
      repository.findCartItem.mockResolvedValue(null);
      await expect(service.updateItem('user-id', 'item-id', { quantity: 3 })).rejects.toMatchObject({ response: { code: 'CART_ITEM_NOT_FOUND' } });
    });

    it('should throw COMMON_FORBIDDEN when item belongs to another user', async () => {
      repository.findCartItem.mockResolvedValue({ id: 'item-id', cart: { userId: 'other-id' }, product: mockProduct } as any);
      await expect(service.updateItem('user-id', 'item-id', { quantity: 3 })).rejects.toMatchObject({ response: { code: 'COMMON_FORBIDDEN' } });
    });

    it('should throw CART_STOCK_EXCEEDED when new quantity > stock', async () => {
      repository.findCartItem.mockResolvedValue({ id: 'item-id', cart: { userId: 'user-id' }, product: mockProduct } as any);
      await expect(service.updateItem('user-id', 'item-id', { quantity: 20 })).rejects.toMatchObject({ response: { code: 'CART_STOCK_EXCEEDED' } });
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      repository.findCartItem.mockResolvedValue({ id: 'item-id', cart: { userId: 'user-id' }, product: mockProduct } as any);
      repository.removeItem.mockResolvedValue({ id: 'cart-id', items: [] } as any);
      const result = await service.removeItem('user-id', 'item-id');
      expect(repository.removeItem).toHaveBeenCalledWith('item-id');
    });

    it('should throw COMMON_FORBIDDEN when item belongs to another user', async () => {
      repository.findCartItem.mockResolvedValue({ id: 'item-id', cart: { userId: 'other-id' }, product: mockProduct } as any);
      await expect(service.removeItem('user-id', 'item-id')).rejects.toMatchObject({ response: { code: 'COMMON_FORBIDDEN' } });
    });
  });

  describe('validateCart', () => {
    it('should return cart when valid', async () => {
      repository.getOrCreateCart.mockResolvedValue(mockCart as any);
      const result = await service.validateCart('user-id');
      expect(result.items).toHaveLength(1);
    });

    it('should throw CART_EMPTY when cart has no items', async () => {
      repository.getOrCreateCart.mockResolvedValue({ id: 'cart-id', items: [] } as any);
      await expect(service.validateCart('user-id')).rejects.toMatchObject({ response: { code: 'CART_EMPTY' } });
    });

    it('should throw CART_STOCK_EXCEEDED when item exceeds stock', async () => {
      repository.getOrCreateCart.mockResolvedValue({ id: 'cart-id', items: [{ id: 'item-id', product: { ...mockProduct, stock: 1 }, quantity: 5 }] } as any);
      await expect(service.validateCart('user-id')).rejects.toMatchObject({ response: { code: 'CART_STOCK_EXCEEDED' } });
    });
  });
});
