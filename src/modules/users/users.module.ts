import { Module } from '@nestjs/common';
import { AdminPermissionController } from '@/modules/users/controllers/admin-permission.controller';
import { AdminUserController } from '@/modules/users/controllers/admin-user.controller';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { UserService } from '@/modules/users/services/user.service';

@Module({
  controllers: [AdminUserController, AdminPermissionController],
  providers: [UserService, UserRepository]
})
export class UsersModule {}
