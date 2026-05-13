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
    .addTag('products', 'Public product catalog endpoints')
    .addTag('admin-products', 'Admin product management endpoints')
    .addTag('admin-categories', 'Admin category management endpoints')
    .addTag('admin-customers', 'Admin customer management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });
}
