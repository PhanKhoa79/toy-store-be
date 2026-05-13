import { Module } from '@nestjs/common';
import { ProductMapper } from '@/modules/products/mappers/product.mapper';
import { CustomerAccountController } from '@/modules/customer-account/controllers/customer-account.controller';
import { CustomerAccountRepository } from '@/modules/customer-account/repositories/customer-account.repository';
import { CustomerAccountService } from '@/modules/customer-account/services/customer-account.service';

@Module({
  controllers: [CustomerAccountController],
  providers: [CustomerAccountService, CustomerAccountRepository, ProductMapper]
})
export class CustomerAccountModule {}
