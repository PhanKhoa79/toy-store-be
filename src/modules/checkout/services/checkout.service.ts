import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ApiException } from '@/common/exceptions/api.exception';
import { CheckoutDto } from '@/modules/checkout/dto/checkout.dto';
import { PaymentService } from '@/modules/payments/services/payment.service';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService, private readonly paymentService: PaymentService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const cart = await this.prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
    if (!cart || cart.items.length === 0) throw new ApiException('CART_EMPTY', 'Giỏ hàng đang trống.', HttpStatus.BAD_REQUEST);

    const address = dto.addressId ? await this.prisma.customerAddress.findUnique({ where: { id: dto.addressId } }) : null;
    if (dto.addressId && (!address || address.userId !== userId)) throw new ApiException('CHECKOUT_SHIPPING_INVALID', 'Địa chỉ giao hàng không hợp lệ.', HttpStatus.BAD_REQUEST);

    const recipientName = address?.recipientName ?? dto.recipientName;
    const recipientPhone = address?.recipientPhone ?? dto.recipientPhone;
    const shippingAddress = address?.addressLine ?? dto.shippingAddress;
    if (!recipientName || !recipientPhone || !shippingAddress) throw new ApiException('CHECKOUT_SHIPPING_INVALID', 'Thông tin giao hàng không hợp lệ.', HttpStatus.BAD_REQUEST);

    for (const item of cart.items) {
      if (item.product.status !== 'active') throw new ApiException('CART_PRODUCT_UNAVAILABLE', 'Sản phẩm không khả dụng.', HttpStatus.BAD_REQUEST);
      if (item.quantity > item.product.stock) throw new ApiException('CART_STOCK_EXCEEDED', 'Số lượng vượt quá tồn kho.', HttpStatus.BAD_REQUEST);
    }

    const subtotalAmount = cart.items.reduce((sum, item) => sum + (item.product.salePrice ?? item.product.price) * item.quantity, 0);
    const orderCode = `TS-${Date.now()}`;
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode,
          userId,
          recipientName,
          recipientPhone,
          shippingAddress,
          shippingNote: address?.note ?? dto.shippingNote,
          subtotalAmount,
          shippingFee: 0,
          totalAmount: subtotalAmount,
          orderStatus: 'pending',
          paymentStatus: 'pending',
          items: { create: cart.items.map((item) => ({ productId: item.productId, productName: item.product.name, productSku: item.product.sku, unitPrice: item.product.salePrice ?? item.product.price, quantity: item.quantity, lineTotal: (item.product.salePrice ?? item.product.price) * item.quantity })) },
          payments: { create: { paymentMethod: dto.paymentMethod, paymentStatus: 'pending', amount: subtotalAmount, transactionRef: orderCode } }
        },
        include: { payments: true, items: true }
      });
      for (const item of cart.items) await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });

    return { order: result, paymentUrl: this.paymentService.buildVnpayPaymentUrl(orderCode, subtotalAmount) };
  }
}
