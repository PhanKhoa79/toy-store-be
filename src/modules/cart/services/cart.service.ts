import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '@/common/exceptions/api.exception';
import { ProductMapper } from '@/modules/products/mappers/product.mapper';
import { AddCartItemDto, UpdateCartItemDto } from '@/modules/cart/dto/cart.dto';
import { CartRepository } from '@/modules/cart/repositories/cart.repository';

@Injectable()
export class CartService {
  constructor(private readonly cartRepository: CartRepository, private readonly productMapper: ProductMapper) {}

  async getCart(userId: string) {
    const cart = await this.cartRepository.getOrCreateCart(userId);
    return this.toCartResponse(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.cartRepository.findProduct(dto.productId);
    this.validateProduct(product, dto.quantity);
    const cart = await this.cartRepository.addItem(userId, dto.productId, dto.quantity);
    return this.toCartResponse(cart);
  }

  async updateItem(userId: string, cartItemId: string, dto: UpdateCartItemDto) {
    const item = await this.ensureOwnedItem(userId, cartItemId);
    this.validateProduct(item.product, dto.quantity);
    const cart = await this.cartRepository.updateItem(cartItemId, dto.quantity);
    return this.toCartResponse(cart);
  }

  async removeItem(userId: string, cartItemId: string) {
    await this.ensureOwnedItem(userId, cartItemId);
    const cart = await this.cartRepository.removeItem(cartItemId);
    return this.toCartResponse(cart);
  }

  async validateCart(userId: string) {
    const cart = await this.cartRepository.getOrCreateCart(userId);
    if (!cart.items.length) throw new ApiException('CART_EMPTY', 'Giỏ hàng đang trống.', HttpStatus.BAD_REQUEST);
    for (const item of cart.items) this.validateProduct(item.product, item.quantity);
    return this.toCartResponse(cart);
  }

  private async ensureOwnedItem(userId: string, cartItemId: string) {
    const item = await this.cartRepository.findCartItem(cartItemId);
    if (!item) throw new ApiException('CART_ITEM_NOT_FOUND', 'Không tìm thấy sản phẩm trong giỏ hàng.', HttpStatus.NOT_FOUND);
    if (item.cart.userId !== userId) throw new ApiException('COMMON_FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', HttpStatus.FORBIDDEN);
    return item;
  }

  private validateProduct(product: Awaited<ReturnType<CartRepository['findProduct']>>, quantity: number) {
    if (!product || product.status !== 'active') throw new ApiException('CART_PRODUCT_UNAVAILABLE', 'Sản phẩm không khả dụng.', HttpStatus.BAD_REQUEST);
    if (product.stock <= 0) throw new ApiException('PRODUCT_OUT_OF_STOCK', 'Sản phẩm đã hết hàng.', HttpStatus.BAD_REQUEST);
    if (quantity > product.stock) throw new ApiException('CART_STOCK_EXCEEDED', 'Số lượng vượt quá tồn kho.', HttpStatus.BAD_REQUEST);
  }

  private toCartResponse(cart: Awaited<ReturnType<CartRepository['findCart']>>) {
    const items = cart?.items ?? [];
    const mappedItems = items.map((item) => {
      const product = this.productMapper.toDto(item.product);
      const unitPrice = product.salePrice ?? product.price;
      return { id: item.id, product, quantity: item.quantity, unitPrice, lineTotal: unitPrice * item.quantity };
    });
    return { id: cart?.id, items: mappedItems, subtotalAmount: mappedItems.reduce((sum, item) => sum + item.lineTotal, 0) };
  }
}
