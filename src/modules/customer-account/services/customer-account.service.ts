import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '@/common/exceptions/api.exception';
import { ProductMapper } from '@/modules/products/mappers/product.mapper';
import { AddWishlistItemDto, CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from '@/modules/customer-account/dto/customer-account.dto';
import { CustomerAccountRepository } from '@/modules/customer-account/repositories/customer-account.repository';

@Injectable()
export class CustomerAccountService {
  constructor(
    private readonly repository: CustomerAccountRepository,
    private readonly productMapper: ProductMapper
  ) {}

  async getProfile(userId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) throw new ApiException('USER_NOT_FOUND', 'Không tìm thấy người dùng.', HttpStatus.NOT_FOUND);
    return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role, isActive: user.isActive };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.repository.updateProfile(userId, dto);
    return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role, isActive: user.isActive };
  }

  listAddresses(userId: string) {
    return this.repository.listAddresses(userId);
  }

  createAddress(userId: string, dto: CreateAddressDto) {
    return this.repository.createAddress(userId, dto);
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    await this.ensureOwnedAddress(userId, id);
    return this.repository.updateAddress(id, dto);
  }

  async deleteAddress(userId: string, id: string) {
    await this.ensureOwnedAddress(userId, id);
    return this.repository.deleteAddress(id);
  }

  async setDefaultAddress(userId: string, id: string) {
    await this.ensureOwnedAddress(userId, id);
    return this.repository.setDefaultAddress(userId, id);
  }

  async listWishlist(userId: string) {
    const items = await this.repository.listWishlist(userId);
    return items.map((item) => ({ id: item.id, product: this.productMapper.toDto(item.product), createdAt: item.createdAt }));
  }

  async addWishlistItem(userId: string, dto: AddWishlistItemDto) {
    const product = await this.repository.findProduct(dto.productId);
    if (!product || product.status !== 'active') throw new ApiException('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.', HttpStatus.NOT_FOUND);
    const existing = await this.repository.findWishlistItem(userId, dto.productId);
    if (existing) throw new ApiException('WISHLIST_ITEM_ALREADY_EXISTS', 'Sản phẩm đã có trong wishlist.', HttpStatus.CONFLICT);
    const item = await this.repository.createWishlistItem(userId, dto.productId);
    return { id: item.id, product: this.productMapper.toDto(item.product), createdAt: item.createdAt };
  }

  async removeWishlistItem(userId: string, productId: string) {
    const existing = await this.repository.findWishlistItem(userId, productId);
    if (!existing) throw new ApiException('WISHLIST_ITEM_NOT_FOUND', 'Không tìm thấy wishlist item.', HttpStatus.NOT_FOUND);
    return this.repository.deleteWishlistItem(userId, productId);
  }

  private async ensureOwnedAddress(userId: string, id: string) {
    const address = await this.repository.findAddress(id);
    if (!address) throw new ApiException('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.', HttpStatus.NOT_FOUND);
    if (address.userId !== userId) throw new ApiException('ADDRESS_NOT_OWNED_BY_CUSTOMER', 'Địa chỉ không thuộc tài khoản hiện tại.', HttpStatus.FORBIDDEN);
  }
}
