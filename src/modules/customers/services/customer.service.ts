import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import { AdminListCustomersQueryDto } from '@/modules/customers/dto/customer-admin.dto';
import { CustomerRepository } from '@/modules/customers/repositories/customer.repository';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async listAdminCustomers(query: AdminListCustomersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.UserWhereInput = { role: 'customer' };
    if (query.search) where.OR = [{ email: { contains: query.search, mode: 'insensitive' } }, { fullName: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }];
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.locked === true) where.lockedAt = { not: null };
    if (query.locked === false) where.lockedAt = null;
    const [total, customers] = await Promise.all([this.customerRepository.count(where), this.customerRepository.findMany(where, page, pageSize)]);
    return { data: customers, meta: createPaginationMeta(page, pageSize, total) };
  }

  async getAdminCustomer(id: string) {
    const customer = await this.customerRepository.findDetail(id);
    if (!customer) throw new ApiException('USER_NOT_FOUND', 'Không tìm thấy khách hàng.', HttpStatus.NOT_FOUND);
    return customer;
  }

  async lockCustomer(id: string) {
    await this.getAdminCustomer(id);
    return this.customerRepository.updateLock(id, true);
  }

  async unlockCustomer(id: string) {
    await this.getAdminCustomer(id);
    return this.customerRepository.updateLock(id, false);
  }
}
