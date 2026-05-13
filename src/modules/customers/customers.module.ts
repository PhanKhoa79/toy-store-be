import { Module } from '@nestjs/common';
import { AdminCustomerController } from '@/modules/customers/controllers/admin-customer.controller';
import { CustomerRepository } from '@/modules/customers/repositories/customer.repository';
import { CustomerService } from '@/modules/customers/services/customer.service';

@Module({
  controllers: [AdminCustomerController],
  providers: [CustomerService, CustomerRepository],
  exports: [CustomerService, CustomerRepository]
})
export class CustomersModule {}
