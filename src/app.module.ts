import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ProductsModule } from '@/modules/products/products.module';
import { UploadsModule } from '@/modules/uploads/uploads.module';
import { HomepageSlidesModule } from '@/modules/homepage-slides/homepage-slides.module';
import { BlogsModule } from '@/modules/blogs/blogs.module';
import { BrandsModule } from '@/modules/brands/brands.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { ReviewsModule } from '@/modules/reviews/reviews.module';
import { CustomerAccountModule } from '@/modules/customer-account/customer-account.module';
import { CheckoutModule } from '@/modules/checkout/checkout.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { CustomersModule } from '@/modules/customers/customers.module';
import { UsersModule } from '@/modules/users/users.module';
import { LiveChatModule } from '@/modules/live-chat/live-chat.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { PaymentModule } from '@/modules/payments/payment.module';
import { CartModule } from '@/modules/cart/cart.module';
import { HealthModule } from '@/modules/health/health.module';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    ProductsModule,
    UploadsModule,
    HomepageSlidesModule,
    BlogsModule,
    BrandsModule,
    CategoriesModule,
    ReviewsModule,
    CustomerAccountModule,
    CheckoutModule,
    OrdersModule,
    CustomersModule,
    UsersModule,
    LiveChatModule,
    ReportsModule,
    PaymentModule,
    CartModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard }
  ]
})
export class AppModule {}
