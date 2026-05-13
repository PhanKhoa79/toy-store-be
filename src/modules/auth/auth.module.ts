import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@/modules/auth/controllers/auth.controller';
import { AuthMapper } from '@/modules/auth/mappers/auth.mapper';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { AuthService } from '@/modules/auth/services/auth.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthMapper],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
