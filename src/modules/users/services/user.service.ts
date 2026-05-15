import { HttpStatus, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import { AdminUserListQueryDto, CreateAdminUserDto, UpdateAdminUserDto, UpdateUserPermissionsDto } from '@/modules/users/dto/admin-user.dto';
import { UserRepository } from '@/modules/users/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async listUsers(query: AdminUserListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.UserWhereInput = { role: { in: ['staff', 'admin'] } };
    if (query.search) where.OR = [{ email: { contains: query.search, mode: 'insensitive' } }, { fullName: { contains: query.search, mode: 'insensitive' } }];
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    const [total, users] = await Promise.all([this.userRepository.count(where), this.userRepository.findMany(where, page, pageSize)]);
    return { data: users, meta: createPaginationMeta(page, pageSize, total) };
  }

  async createUser(dto: CreateAdminUserDto) {
    if (await this.userRepository.findByEmail(dto.email)) throw new ApiException('USER_EMAIL_ALREADY_EXISTS', 'Email đã được sử dụng.', HttpStatus.CONFLICT);
    const passwordHash = await argon2.hash(dto.password);
    return this.userRepository.create({ email: dto.email, passwordHash, fullName: dto.fullName, phone: dto.phone, role: dto.role, isActive: dto.isActive ?? true });
  }

  async getUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user || !['staff', 'admin'].includes(user.role)) throw new ApiException('USER_NOT_FOUND', 'Không tìm thấy người dùng.', HttpStatus.NOT_FOUND);
    return user;
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const user = await this.getUser(id);
    if (dto.email && dto.email !== user.email && (await this.userRepository.findByEmail(dto.email))) throw new ApiException('USER_EMAIL_ALREADY_EXISTS', 'Email đã được sử dụng.', HttpStatus.CONFLICT);
    await this.ensureNotLastAdmin(id, dto);
    const data: Prisma.UserUpdateInput = { ...dto };
    if (dto.password) data.passwordHash = await argon2.hash(dto.password);
    delete (data as { password?: string }).password;
    return this.userRepository.update(id, data);
  }

  listPermissions() {
    return this.userRepository.listPermissions();
  }

  async updatePermissions(id: string, dto: UpdateUserPermissionsDto, actorId: string) {
    if (id === actorId) throw new ApiException('USER_CANNOT_MODIFY_SELF_PERMISSION', 'Không được phép thay đổi quyền của chính mình.', HttpStatus.FORBIDDEN);
    const user = await this.getUser(id);
    if (user.role === 'admin') return user;
    return this.userRepository.updatePermissions(id, dto.permissionIds);
  }

  private async ensureNotLastAdmin(id: string, dto: UpdateAdminUserDto) {
    const user = await this.getUser(id);
    const wouldStopAdmin = user.role === 'admin' && (dto.role === 'staff' || dto.isActive === false);
    if (wouldStopAdmin && (await this.userRepository.countActiveAdmins(id)) === 0) {
      throw new ApiException('USER_LAST_ADMIN_LOCKED', 'Không được khóa hoặc vô hiệu hóa admin cuối cùng.', HttpStatus.BAD_REQUEST);
    }
  }
}
