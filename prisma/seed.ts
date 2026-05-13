import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@toyshop.local' },
    update: {},
    create: {
      email: 'admin@toyshop.local',
      passwordHash,
      fullName: 'Toyshop Admin',
      phone: '0900000001',
      role: 'admin'
    }
  });

  await prisma.user.upsert({
    where: { email: 'customer@toyshop.local' },
    update: {},
    create: {
      email: 'customer@toyshop.local',
      passwordHash,
      fullName: 'Demo Customer',
      phone: '0900000002',
      role: 'customer'
    }
  });

  const permissions = [
    ['product-catalog', 'read'],
    ['admin-product-management', 'manage'],
    ['order-management', 'manage'],
    ['customer-management', 'manage'],
    ['blog-management', 'manage'],
    ['homepage-slide', 'manage'],
    ['live-chat', 'manage'],
    ['report-analytics', 'read'],
    ['user-permission', 'manage']
  ] as const;

  for (const [module, action] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { module_action: { module, action } },
      update: {},
      create: { module, action, description: `${module}:${action}` }
    });
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: admin.id, permissionId: permission.id } },
      update: {},
      create: { userId: admin.id, permissionId: permission.id }
    });
  }

  const category = await prisma.category.upsert({
    where: { slug: 'do-choi-giao-duc' },
    update: {},
    create: {
      name: 'Do choi giao duc',
      slug: 'do-choi-giao-duc',
      description: 'San pham ho tro tu duy, van dong va sang tao cho be.',
      status: 'active',
      displayOrder: 1
    }
  });

  const brand = await prisma.brand.upsert({
    where: { slug: 'tiny-stars' },
    update: {},
    create: {
      name: 'Tiny Stars',
      slug: 'tiny-stars',
      description: 'Thuong hieu demo cho MVP.',
      status: 'active',
      displayOrder: 1
    }
  });

  const products = [
    {
      name: 'Bo xep hinh cau vong',
      slug: 'bo-xep-hinh-cau-vong',
      sku: 'TS-BXH-001',
      shortDescription: 'Bo khoi go mau sac giup be nhan dien hinh khoi.',
      gender: 'unisex',
      ageRange: '3-5 tuoi',
      price: 250000,
      salePrice: 219000,
      stock: 40
    },
    {
      name: 'Xe dieu khien mini',
      slug: 'xe-dieu-khien-mini',
      sku: 'TS-XDK-002',
      shortDescription: 'Xe dieu khien nho gon cho be tap phan xa.',
      gender: 'boy',
      ageRange: '5-8 tuoi',
      price: 390000,
      salePrice: null,
      stock: 25
    },
    {
      name: 'Bo bep nau an mini',
      slug: 'bo-bep-nau-an-mini',
      sku: 'TS-BEP-003',
      shortDescription: 'Bo do choi nhap vai giup be hoc ky nang giao tiep.',
      gender: 'girl',
      ageRange: '3-6 tuoi',
      price: 320000,
      salePrice: 299000,
      stock: 30
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...product,
        brandId: brand.id,
        categoryId: category.id,
        description: product.shortDescription,
        status: 'active'
      }
    });
  }

  const existingSlide = await prisma.homepageSlide.findFirst({
    where: { title: 'Toyshop MVP' }
  });

  if (!existingSlide) {
    await prisma.homepageSlide.create({
      data: {
        title: 'Toyshop MVP',
        subtitle: 'Do choi an toan, vui hoc moi ngay',
        imageUrl: '/uploads/demo-slide.jpg',
        linkUrl: '/products',
        displayOrder: 1,
        isActive: true
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
