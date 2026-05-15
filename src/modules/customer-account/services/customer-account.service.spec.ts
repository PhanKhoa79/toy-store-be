import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAccountService } from './customer-account.service';
import { CustomerAccountRepository } from '../repositories/customer-account.repository';
import { ProductMapper } from '@/modules/products/mappers/product.mapper';
import { ApiException } from '@/common/exceptions/api.exception';

describe('CustomerAccountService', () => {
  let service: CustomerAccountService;
  let repository: jest.Mocked<CustomerAccountRepository>;
  let productMapper: jest.Mocked<ProductMapper>;

  const mockUser = {
    id: 'user-id',
    email: 'customer@example.com',
    fullName: 'Customer',
    phone: '0900000000',
    role: 'customer',
    isActive: true
  };

  const mockProduct = { id: 'product-id', name: 'Product', status: 'active' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAccountService,
        {
          provide: CustomerAccountRepository,
          useValue: {
            findUserById: jest.fn(),
            updateProfile: jest.fn(),
            listAddresses: jest.fn(),
            findAddress: jest.fn(),
            createAddress: jest.fn(),
            updateAddress: jest.fn(),
            deleteAddress: jest.fn(),
            setDefaultAddress: jest.fn(),
            listWishlist: jest.fn(),
            findWishlistItem: jest.fn(),
            createWishlistItem: jest.fn(),
            deleteWishlistItem: jest.fn(),
            findProduct: jest.fn()
          }
        },
        {
          provide: ProductMapper,
          useValue: {
            toDto: jest.fn().mockReturnValue({ id: 'product-id', name: 'Product', price: 100000, status: 'active', stock: 10, brand: {}, category: {} })
          }
        }
      ]
    }).compile();

    service = module.get<CustomerAccountService>(CustomerAccountService);
    repository = module.get(CustomerAccountRepository);
    productMapper = module.get(ProductMapper);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('should return customer profile without password hash', async () => {
      repository.findUserById.mockResolvedValue(mockUser as any);
      const result = await service.getProfile('user-id');
      expect(result.email).toBe('customer@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      repository.findUserById.mockResolvedValue(null);
      await expect(service.getProfile('user-id')).rejects.toMatchObject({ response: { code: 'USER_NOT_FOUND' } });
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      repository.updateProfile.mockResolvedValue({ ...mockUser, fullName: 'Updated' } as any);
      const result = await service.updateProfile('user-id', { fullName: 'Updated', phone: '0900000001' } as any);
      expect(result.fullName).toBe('Updated');
    });

    it('should throw PROFILE_EMAIL_UPDATE_NOT_ALLOWED when email is in dto', async () => {
      await expect(service.updateProfile('user-id', { email: 'new@example.com', fullName: 'Test' } as any)).rejects.toMatchObject({ response: { code: 'PROFILE_EMAIL_UPDATE_NOT_ALLOWED' } });
    });
  });

  describe('address management', () => {
    const mockAddress = { id: 'addr-id', userId: 'user-id', recipientName: 'Customer', recipientPhone: '0900000000', addressLine: '123 Street', isDefault: false };

    it('should list addresses', async () => {
      repository.listAddresses.mockResolvedValue([mockAddress] as any);
      const result = await service.listAddresses('user-id');
      expect(result).toHaveLength(1);
    });

    it('should create address', async () => {
      repository.createAddress.mockResolvedValue(mockAddress as any);
      const result = await service.createAddress('user-id', { recipientName: 'Customer', recipientPhone: '0900000000', addressLine: '123 Street' } as any);
      expect(result).toEqual(mockAddress);
    });

    it('should update owned address', async () => {
      repository.findAddress.mockResolvedValue(mockAddress as any);
      repository.updateAddress.mockResolvedValue(mockAddress as any);
      const result = await service.updateAddress('user-id', 'addr-id', { recipientName: 'Updated', recipientPhone: '0900000000', addressLine: '123 Street' } as any);
      expect(repository.updateAddress).toHaveBeenCalled();
    });

    it('should throw ADDRESS_NOT_FOUND when address does not exist', async () => {
      repository.findAddress.mockResolvedValue(null);
      await expect(service.updateAddress('user-id', 'addr-id', {} as any)).rejects.toMatchObject({ response: { code: 'ADDRESS_NOT_FOUND' } });
    });

    it('should throw ADDRESS_NOT_OWNED_BY_CUSTOMER when address belongs to another user', async () => {
      repository.findAddress.mockResolvedValue({ ...mockAddress, userId: 'other-id' } as any);
      await expect(service.updateAddress('user-id', 'addr-id', {} as any)).rejects.toMatchObject({ response: { code: 'ADDRESS_NOT_OWNED_BY_CUSTOMER' } });
    });

    it('should delete owned address', async () => {
      repository.findAddress.mockResolvedValue(mockAddress as any);
      repository.deleteAddress.mockResolvedValue(mockAddress as any);
      await service.deleteAddress('user-id', 'addr-id');
      expect(repository.deleteAddress).toHaveBeenCalledWith('addr-id');
    });

    it('should set default address', async () => {
      repository.findAddress.mockResolvedValue(mockAddress as any);
      repository.setDefaultAddress.mockResolvedValue({ ...mockAddress, isDefault: true } as any);
      const result = await service.setDefaultAddress('user-id', 'addr-id');
      expect(result.isDefault).toBe(true);
    });
  });

  describe('wishlist', () => {
    const mockWishlistItem = { id: 'wl-id', userId: 'user-id', productId: 'product-id', product: mockProduct, createdAt: new Date() };

    it('should list wishlist items', async () => {
      repository.listWishlist.mockResolvedValue([mockWishlistItem] as any);
      const result = await service.listWishlist('user-id');
      expect(result).toHaveLength(1);
    });

    it('should add item to wishlist', async () => {
      repository.findProduct.mockResolvedValue(mockProduct as any);
      repository.findWishlistItem.mockResolvedValue(null);
      repository.createWishlistItem.mockResolvedValue(mockWishlistItem as any);
      const result = await service.addWishlistItem('user-id', { productId: 'product-id' } as any);
      expect(repository.createWishlistItem).toHaveBeenCalled();
    });

    it('should throw WISHLIST_ITEM_ALREADY_EXISTS when duplicate', async () => {
      repository.findProduct.mockResolvedValue(mockProduct as any);
      repository.findWishlistItem.mockResolvedValue(mockWishlistItem as any);
      await expect(service.addWishlistItem('user-id', { productId: 'product-id' } as any)).rejects.toMatchObject({ response: { code: 'WISHLIST_ITEM_ALREADY_EXISTS' } });
    });

    it('should throw PRODUCT_NOT_FOUND when product inactive', async () => {
      repository.findProduct.mockResolvedValue({ ...mockProduct, status: 'inactive' } as any);
      await expect(service.addWishlistItem('user-id', { productId: 'product-id' } as any)).rejects.toMatchObject({ response: { code: 'PRODUCT_NOT_FOUND' } });
    });

    it('should remove wishlist item', async () => {
      repository.findWishlistItem.mockResolvedValue(mockWishlistItem as any);
      repository.deleteWishlistItem.mockResolvedValue(mockWishlistItem as any);
      await service.removeWishlistItem('user-id', 'product-id');
      expect(repository.deleteWishlistItem).toHaveBeenCalledWith('user-id', 'product-id');
    });

    it('should throw WISHLIST_ITEM_NOT_FOUND when item does not exist', async () => {
      repository.findWishlistItem.mockResolvedValue(null);
      await expect(service.removeWishlistItem('user-id', 'product-id')).rejects.toMatchObject({ response: { code: 'WISHLIST_ITEM_NOT_FOUND' } });
    });
  });
});
