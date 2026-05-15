import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const permissions = [
  ['dashboard', 'view'],
  ['admin-product-management', 'view'],
  ['admin-product-management', 'create'],
  ['admin-product-management', 'update'],
  ['admin-product-management', 'delete'],
  ['category-brand-management', 'view'],
  ['category-brand-management', 'create'],
  ['category-brand-management', 'update'],
  ['category-brand-management', 'delete'],
  ['order-management', 'view'],
  ['order-management', 'update'],
  ['customer-management', 'view'],
  ['customer-management', 'update'],
  ['blog-management', 'view'],
  ['blog-management', 'create'],
  ['blog-management', 'update'],
  ['review-comment', 'view'],
  ['review-comment', 'approve'],
  ['homepage-slide', 'view'],
  ['homepage-slide', 'create'],
  ['homepage-slide', 'update'],
  ['homepage-slide', 'delete'],
  ['live-chat', 'view'],
  ['live-chat', 'reply'],
  ['live-chat', 'update'],
  ['report-analytics', 'view'],
  ['user-permission', 'view'],
  ['user-permission', 'create'],
  ['user-permission', 'update'],
  ['user-permission', 'manage']
] as const;

async function assignPermissions(userId: string, allowed: readonly (readonly [string, string])[]) {
  for (const [module, action] of allowed) {
    const permission = await prisma.permission.upsert({
      where: { module_action: { module, action } },
      update: { description: `${module}:${action}` },
      create: { module, action, description: `${module}:${action}` }
    });
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: {},
      create: { userId, permissionId: permission.id }
    });
  }
}

async function main() {
  const passwordHash = await argon2.hash('Password123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@toyshop.local' },
    update: { fullName: 'Toyshop Admin', role: 'admin', isActive: true, lockedAt: null },
    create: {
      email: 'admin@toyshop.local',
      passwordHash,
      fullName: 'Toyshop Admin',
      phone: '0900000001',
      role: 'admin'
    }
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@toyshop.local' },
    update: { fullName: 'Demo Staff', role: 'staff', isActive: true, lockedAt: null },
    create: {
      email: 'staff@toyshop.local',
      passwordHash,
      fullName: 'Demo Staff',
      phone: '0900000003',
      role: 'staff'
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@toyshop.local' },
    update: { fullName: 'Demo Customer', role: 'customer', isActive: true, lockedAt: null },
    create: {
      email: 'customer@toyshop.local',
      passwordHash,
      fullName: 'Demo Customer',
      phone: '0900000002',
      role: 'customer'
    }
  });

  for (const [module, action] of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module, action } },
      update: { description: `${module}:${action}` },
      create: { module, action, description: `${module}:${action}` }
    });
  }

  await assignPermissions(admin.id, permissions);
  await assignPermissions(staff.id, [
    ['dashboard', 'view'],
    ['admin-product-management', 'view'],
    ['admin-product-management', 'create'],
    ['admin-product-management', 'update'],
    ['category-brand-management', 'view'],
    ['order-management', 'view'],
    ['order-management', 'update'],
    ['customer-management', 'view'],
    ['blog-management', 'view'],
    ['review-comment', 'view'],
    ['review-comment', 'approve'],
    ['homepage-slide', 'view'],
    ['live-chat', 'view'],
    ['live-chat', 'reply'],
    ['report-analytics', 'view']
  ]);

  const category = await prisma.category.upsert({
    where: { slug: 'do-choi-giao-duc' },
    update: { name: 'Đồ chơi giáo dục', status: 'active', displayOrder: 1 },
    create: {
      name: 'Đồ chơi giáo dục',
      slug: 'do-choi-giao-duc',
      description: 'Sản phẩm hỗ trợ tư duy, vận động và sáng tạo cho bé.',
      status: 'active',
      displayOrder: 1
    }
  });

  const secondaryCategory = await prisma.category.upsert({
    where: { slug: 'do-choi-nhap-vai' },
    update: { name: 'Đồ chơi nhập vai', status: 'active', displayOrder: 2 },
    create: {
      name: 'Đồ chơi nhập vai',
      slug: 'do-choi-nhap-vai',
      description: 'Đồ chơi giúp bé nhập vai và phát triển kỹ năng giao tiếp.',
      status: 'active',
      displayOrder: 2
    }
  });

  const brand = await prisma.brand.upsert({
    where: { slug: 'tiny-stars' },
    update: { status: 'active', displayOrder: 1 },
    create: {
      name: 'Tiny Stars',
      slug: 'tiny-stars',
      description: 'Thương hiệu demo cho MVP.',
      logoUrl: '/uploads/brands/tiny-stars.jpg',
      status: 'active',
      displayOrder: 1
    }
  });

  const secondBrand = await prisma.brand.upsert({
    where: { slug: 'happy-kids' },
    update: { status: 'active', displayOrder: 2 },
    create: {
      name: 'Happy Kids',
      slug: 'happy-kids',
      description: 'Thương hiệu đồ chơi an toàn cho trẻ em.',
      logoUrl: '/uploads/brands/happy-kids.jpg',
      status: 'active',
      displayOrder: 2
    }
  });

  const productInputs = [
    {
      name: 'Bộ xếp hình cầu vồng',
      slug: 'bo-xep-hinh-cau-vong',
      sku: 'TS-BXH-001',
      shortDescription: 'Bộ khối gỗ màu sắc giúp bé nhận diện hình khối.',
      description: 'Bộ xếp hình cầu vồng hỗ trợ bé phát triển tư duy không gian, màu sắc và khả năng phối hợp tay mắt.',
      gender: 'unisex',
      ageRange: '3-5 tuổi',
      price: 250000,
      salePrice: 219000,
      stock: 40,
      categoryId: category.id,
      brandId: brand.id,
      thumbnailUrl: '/uploads/products/bo-xep-hinh-cau-vong.jpg'
    },
    {
      name: 'Xe điều khiển mini',
      slug: 'xe-dieu-khien-mini',
      sku: 'TS-XDK-002',
      shortDescription: 'Xe điều khiển nhỏ gọn cho bé tập phản xạ.',
      description: 'Xe điều khiển mini có thiết kế nhỏ gọn, phù hợp cho trẻ từ 5 tuổi.',
      gender: 'boy',
      ageRange: '5-8 tuổi',
      price: 390000,
      salePrice: null,
      stock: 25,
      categoryId: category.id,
      brandId: secondBrand.id,
      thumbnailUrl: '/uploads/products/xe-dieu-khien-mini.jpg'
    },
    {
      name: 'Bộ bếp nấu ăn mini',
      slug: 'bo-bep-nau-an-mini',
      sku: 'TS-BEP-003',
      shortDescription: 'Bộ đồ chơi nhập vai giúp bé học kỹ năng giao tiếp.',
      description: 'Bộ bếp nấu ăn mini giúp bé nhập vai, học cách chia sẻ và giao tiếp.',
      gender: 'girl',
      ageRange: '3-6 tuổi',
      price: 320000,
      salePrice: 299000,
      stock: 30,
      categoryId: secondaryCategory.id,
      brandId: brand.id,
      thumbnailUrl: '/uploads/products/bo-bep-nau-an-mini.jpg'
    }
  ];

  const products = [];
  for (const product of productInputs) {
    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, status: 'active' },
      create: { ...product, status: 'active' }
    });
    products.push(savedProduct);
    const existingImage = savedProduct.thumbnailUrl
      ? await prisma.productImage.findFirst({ where: { productId: savedProduct.id, imageUrl: savedProduct.thumbnailUrl } })
      : null;
    if (!existingImage && savedProduct.thumbnailUrl) {
      await prisma.productImage.create({
        data: { productId: savedProduct.id, imageUrl: savedProduct.thumbnailUrl, altText: savedProduct.name, displayOrder: 1 }
      });
    }
  }

  await prisma.customerAddress.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: { userId: customer.id, isDefault: true },
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      userId: customer.id,
      recipientName: 'Demo Customer',
      recipientPhone: '0900000002',
      addressLine: '123 Đường Demo, Quận 1, TP. Hồ Chí Minh',
      note: 'Giao giờ hành chính',
      isDefault: true
    }
  });
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: customer.id, productId: products[1].id } },
    update: {},
    create: { userId: customer.id, productId: products[1].id }
  });

  const cart = await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id }
  });

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: products[0].id } },
    update: { quantity: 1 },
    create: { cartId: cart.id, productId: products[0].id, quantity: 1 }
  });

  const subtotalAmount = (products[0].salePrice ?? products[0].price) * 1;
  const order = await prisma.order.upsert({
    where: { orderCode: 'TS-DEMO-0001' },
    update: { orderStatus: 'delivered', paymentStatus: 'paid' },
    create: {
      orderCode: 'TS-DEMO-0001',
      userId: customer.id,
      recipientName: 'Demo Customer',
      recipientPhone: '0900000002',
      shippingAddress: '123 Đường Demo, Quận 1, TP. Hồ Chí Minh',
      shippingNote: 'Giao giờ hành chính',
      subtotalAmount,
      shippingFee: 0,
      totalAmount: subtotalAmount,
      orderStatus: 'delivered',
      paymentStatus: 'paid'
    }
  });

  const existingOrderItem = await prisma.orderItem.findFirst({ where: { orderId: order.id, productId: products[0].id } });
  if (!existingOrderItem) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: products[0].id,
        productName: products[0].name,
        productSku: products[0].sku,
        unitPrice: products[0].salePrice ?? products[0].price,
        quantity: 1,
        lineTotal: subtotalAmount
      }
    });
  }

  await prisma.payment.upsert({
    where: { transactionRef: 'TS-DEMO-0001' },
    update: { paymentStatus: 'paid', amount: subtotalAmount, paidAt: new Date() },
    create: {
      orderId: order.id,
      paymentMethod: 'vnpay',
      paymentStatus: 'paid',
      amount: subtotalAmount,
      transactionRef: 'TS-DEMO-0001',
      vnpayTransactionNo: 'DEMO0001',
      vnpayResponseCode: '00',
      vnpayBankCode: 'NCB',
      paidAt: new Date()
    }
  });

  await prisma.review.upsert({
    where: { productId_userId_orderId: { productId: products[0].id, userId: customer.id, orderId: order.id } },
    update: { status: 'approved', moderatedBy: admin.id, moderatedAt: new Date() },
    create: {
      productId: products[0].id,
      userId: customer.id,
      orderId: order.id,
      rating: 5,
      content: 'Sản phẩm đẹp, bé rất thích.',
      status: 'approved',
      moderatedBy: admin.id,
      moderatedAt: new Date()
    }
  });

  await prisma.blogPost.upsert({
    where: { slug: 'chon-do-choi-an-toan-cho-be' },
    update: { status: 'published', publishedAt: new Date() },
    create: {
      title: 'Chọn đồ chơi an toàn cho bé',
      slug: 'chon-do-choi-an-toan-cho-be',
      excerpt: 'Một số lưu ý khi chọn đồ chơi an toàn và phù hợp độ tuổi.',
      content: 'Nội dung demo về cách chọn đồ chơi an toàn cho bé trong MVP.',
      thumbnailUrl: '/uploads/blogs/chon-do-choi-an-toan-cho-be.jpg',
      status: 'published',
      authorId: admin.id,
      publishedAt: new Date()
    }
  });

  const existingSlide = await prisma.homepageSlide.findFirst({ where: { title: 'Toyshop MVP' } });
  if (!existingSlide) {
    await prisma.homepageSlide.create({
      data: {
        title: 'Toyshop MVP',
        subtitle: 'Đồ chơi an toàn, vui học mỗi ngày',
        imageUrl: '/uploads/slides/demo-slide.jpg',
        linkUrl: '/products',
        displayOrder: 1,
        isActive: true
      }
    });
  }

  const conversation = await prisma.chatConversation.findFirst({ where: { guestEmail: 'guest@toyshop.local' } });
  if (!conversation) {
    const createdConversation = await prisma.chatConversation.create({
      data: {
        guestName: 'Demo Guest',
        guestEmail: 'guest@toyshop.local',
        subject: 'Tư vấn sản phẩm',
        status: 'open',
        lastMessageAt: new Date()
      }
    });
    await prisma.chatMessage.create({
      data: {
        conversationId: createdConversation.id,
        senderRole: 'guest',
        message: 'Shop tư vấn giúp mình sản phẩm cho bé 4 tuổi.'
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
