import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, apiPrefix: string) {
  const config = new DocumentBuilder()
    .setTitle('Toyshop API')
    .setDescription('API documentation for Toyshop MVP ecommerce backend')
    .setVersion('0.1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'JWT access token stored in HttpOnly cookie'
    })
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Public product catalog endpoints')
    .addTag('categories', 'Public category endpoints')
    .addTag('brands', 'Public brand endpoints')
    .addTag('blogs', 'Public blog endpoints')
    .addTag('homepage-slides', 'Public homepage slide endpoints')
    .addTag('reviews', 'Product review endpoints')
    .addTag('cart', 'Customer cart endpoints')
    .addTag('checkout', 'Checkout endpoints')
    .addTag('payments', 'Payment endpoints')
    .addTag('orders', 'Customer order endpoints')
    .addTag('admin-products', 'Admin product management endpoints')
    .addTag('admin-categories', 'Admin category management endpoints')
    .addTag('admin-brands', 'Admin brand management endpoints')
    .addTag('admin-blogs', 'Admin blog management endpoints')
    .addTag('admin-homepage-slides', 'Admin homepage slide endpoints')
    .addTag('admin-reviews', 'Admin review moderation endpoints')
    .addTag('admin-orders', 'Admin order management endpoints')
    .addTag('admin-customers', 'Admin customer management endpoints')
    .addTag('admin-users', 'Admin user management endpoints')
    .addTag('admin-permissions', 'Admin permission endpoints')
    .addTag('uploads', 'Admin upload endpoints')
    .addTag('live-chat', 'Live chat endpoints')
    .addTag('reports', 'Admin report endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });
}
