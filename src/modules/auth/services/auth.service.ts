import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ApiException } from '@/common/exceptions/api.exception';
import type { AuthSession, CurrentUser } from '@/common/contracts';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { AuthMapper } from '@/modules/auth/mappers/auth.mapper';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authMapper: AuthMapper,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private validatePasswordStrength(password: string) {
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strong.test(password)) {
      throw new ApiException('AUTH_PASSWORD_TOO_WEAK', 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.', HttpStatus.BAD_REQUEST);
    }
  }

  async register(dto: RegisterDto): Promise<AuthSession & { tokens: AuthTokens }> {
    const existingUser = await this.authRepository.findUserByEmail(dto.email);
    if (existingUser) throw new ApiException('AUTH_EMAIL_ALREADY_EXISTS', 'Email đã được sử dụng.', HttpStatus.CONFLICT);
    this.validatePasswordStrength(dto.password);

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.authRepository.createCustomer({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone
    });
    const currentUser = this.authMapper.toCurrentUser(user);
    return { user: currentUser, tokens: this.createTokens(currentUser) };
  }

  async login(dto: LoginDto): Promise<AuthSession & { tokens: AuthTokens }> {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) throw new ApiException('AUTH_INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.', HttpStatus.UNAUTHORIZED);

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) throw new ApiException('AUTH_INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.', HttpStatus.UNAUTHORIZED);
    if (!user.isActive || user.lockedAt) throw new ApiException('AUTH_ACCOUNT_LOCKED', 'Tài khoản đã bị khóa hoặc ngừng hoạt động.', HttpStatus.FORBIDDEN);

    await this.authRepository.updateLastLogin(user.id);
    const currentUser = this.authMapper.toCurrentUser(user);
    return { user: currentUser, tokens: this.createTokens(currentUser) };
  }

  async me(userId: string): Promise<CurrentUser> {
    const user = await this.authRepository.findUserById(userId);
    if (!user || !user.isActive || user.lockedAt) throw new ApiException('COMMON_UNAUTHORIZED', 'Tài khoản không hợp lệ.', HttpStatus.UNAUTHORIZED);
    return this.authMapper.toCurrentUser(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    if (!refreshToken) throw new ApiException('AUTH_REFRESH_TOKEN_INVALID', 'Refresh token không hợp lệ.', HttpStatus.UNAUTHORIZED);
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')
      });
      const user = await this.me(payload.sub);
      return this.createTokens(user);
    } catch {
      throw new ApiException('AUTH_REFRESH_TOKEN_INVALID', 'Refresh token không hợp lệ.', HttpStatus.UNAUTHORIZED);
    }
  }

  createTokens(user: CurrentUser): AuthTokens {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m')
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')
      })
    };
  }
}
