import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthMapper } from '../mappers/auth.mapper';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ApiException } from '@/common/exceptions/api.exception';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<AuthRepository>;
  let mapper: jest.Mocked<AuthMapper>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    fullName: 'Test User',
    phone: '0900000000',
    role: 'customer',
    isActive: true,
    lockedAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userPermissions: []
  };

  const mockCurrentUser = {
    id: 'user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    phone: '0900000000',
    role: 'customer' as const,
    isActive: true,
    permissions: []
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
            createCustomer: jest.fn(),
            updateLastLogin: jest.fn()
          }
        },
        {
          provide: AuthMapper,
          useValue: {
            toCurrentUser: jest.fn().mockReturnValue(mockCurrentUser)
          }
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token'),
            verifyAsync: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
              const map: Record<string, string> = {
                JWT_ACCESS_SECRET: 'access-secret',
                JWT_REFRESH_SECRET: 'refresh-secret',
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d'
              };
              return map[key] ?? defaultValue;
            })
          }
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(AuthRepository);
    mapper = module.get(AuthMapper);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const dto: RegisterDto = { email: 'test@example.com', password: 'Password123!', fullName: 'Test User', phone: '0900000000' };

    it('should create a new customer when email does not exist', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      repository.createCustomer.mockResolvedValue(mockUser as any);

      const result = await service.register(dto);

      expect(repository.findUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(repository.createCustomer).toHaveBeenCalled();
      expect(result.user).toEqual(mockCurrentUser);
      expect(result.tokens).toBeDefined();
    });

    it('should throw AUTH_EMAIL_ALREADY_EXISTS when email exists', async () => {
      repository.findUserByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(dto)).rejects.toThrow(ApiException);
      await expect(service.register(dto)).rejects.toMatchObject({
        response: { code: 'AUTH_EMAIL_ALREADY_EXISTS' }
      });
    });

    it('should throw AUTH_PASSWORD_TOO_WEAK for weak password', async () => {
      const weakDto = { ...dto, password: 'weak' };
      repository.findUserByEmail.mockResolvedValue(null);

      await expect(service.register(weakDto as RegisterDto)).rejects.toThrow(ApiException);
      await expect(service.register(weakDto as RegisterDto)).rejects.toMatchObject({
        response: { code: 'AUTH_PASSWORD_TOO_WEAK' }
      });
    });

    it('should throw AUTH_PASSWORD_TOO_WEAK for password missing uppercase', async () => {
      const weakDto = { ...dto, password: 'password123!' };
      repository.findUserByEmail.mockResolvedValue(null);
      await expect(service.register(weakDto as RegisterDto)).rejects.toMatchObject({ response: { code: 'AUTH_PASSWORD_TOO_WEAK' } });
    });

    it('should throw AUTH_PASSWORD_TOO_WEAK for password missing lowercase', async () => {
      const weakDto = { ...dto, password: 'PASSWORD123!' };
      repository.findUserByEmail.mockResolvedValue(null);
      await expect(service.register(weakDto as RegisterDto)).rejects.toMatchObject({ response: { code: 'AUTH_PASSWORD_TOO_WEAK' } });
    });

    it('should throw AUTH_PASSWORD_TOO_WEAK for password missing digit', async () => {
      const weakDto = { ...dto, password: 'Password!!!' };
      repository.findUserByEmail.mockResolvedValue(null);
      await expect(service.register(weakDto as RegisterDto)).rejects.toMatchObject({ response: { code: 'AUTH_PASSWORD_TOO_WEAK' } });
    });

    it('should throw AUTH_PASSWORD_TOO_WEAK for password missing special char', async () => {
      const weakDto = { ...dto, password: 'Password123' };
      repository.findUserByEmail.mockResolvedValue(null);
      await expect(service.register(weakDto as RegisterDto)).rejects.toMatchObject({ response: { code: 'AUTH_PASSWORD_TOO_WEAK' } });
    });
  });

  describe('login', () => {
    const dto: LoginDto = { email: 'test@example.com', password: 'Password123!' };

    it('should login with valid credentials', async () => {
      repository.findUserByEmail.mockResolvedValue(mockUser as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      repository.updateLastLogin.mockResolvedValue(undefined as any);

      const result = await service.login(dto);

      expect(repository.findUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.passwordHash, dto.password);
      expect(repository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(result.user).toEqual(mockCurrentUser);
    });

    it('should throw AUTH_INVALID_CREDENTIALS when user not found', async () => {
      repository.findUserByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toMatchObject({ response: { code: 'AUTH_INVALID_CREDENTIALS' } });
    });

    it('should throw AUTH_INVALID_CREDENTIALS when password invalid', async () => {
      repository.findUserByEmail.mockResolvedValue(mockUser as any);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toMatchObject({ response: { code: 'AUTH_INVALID_CREDENTIALS' } });
    });

    it('should throw AUTH_ACCOUNT_LOCKED when user is inactive', async () => {
      repository.findUserByEmail.mockResolvedValue({ ...mockUser, isActive: false } as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toMatchObject({ response: { code: 'AUTH_ACCOUNT_LOCKED' } });
    });

    it('should throw AUTH_ACCOUNT_LOCKED when user is locked', async () => {
      repository.findUserByEmail.mockResolvedValue({ ...mockUser, lockedAt: new Date() } as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toMatchObject({ response: { code: 'AUTH_ACCOUNT_LOCKED' } });
    });
  });

  describe('me', () => {
    it('should return current user', async () => {
      repository.findUserById.mockResolvedValue(mockUser as any);
      const result = await service.me('user-id');
      expect(result).toEqual(mockCurrentUser);
    });

    it('should throw COMMON_UNAUTHORIZED when user not found', async () => {
      repository.findUserById.mockResolvedValue(null);
      await expect(service.me('user-id')).rejects.toMatchObject({ response: { code: 'COMMON_UNAUTHORIZED' } });
    });

    it('should throw COMMON_UNAUTHORIZED when user is inactive', async () => {
      repository.findUserById.mockResolvedValue({ ...mockUser, isActive: false } as any);
      await expect(service.me('user-id')).rejects.toMatchObject({ response: { code: 'COMMON_UNAUTHORIZED' } });
    });

    it('should throw COMMON_UNAUTHORIZED when user is locked', async () => {
      repository.findUserById.mockResolvedValue({ ...mockUser, lockedAt: new Date() } as any);
      await expect(service.me('user-id')).rejects.toMatchObject({ response: { code: 'COMMON_UNAUTHORIZED' } });
    });
  });

  describe('refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
      repository.findUserById.mockResolvedValue(mockUser as any);
      const result = await service.refresh('valid-refresh-token');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw AUTH_REFRESH_TOKEN_INVALID when token is missing', async () => {
      await expect(service.refresh(undefined)).rejects.toMatchObject({ response: { code: 'AUTH_REFRESH_TOKEN_INVALID' } });
    });

    it('should throw AUTH_REFRESH_TOKEN_INVALID when token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      await expect(service.refresh('invalid-token')).rejects.toMatchObject({ response: { code: 'AUTH_REFRESH_TOKEN_INVALID' } });
    });
  });

  describe('createTokens', () => {
    it('should sign tokens with correct payload and secrets', () => {
      service.createTokens(mockCurrentUser);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockCurrentUser.id, email: mockCurrentUser.email, role: mockCurrentUser.role },
        { secret: 'access-secret', expiresIn: '15m' }
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockCurrentUser.id, email: mockCurrentUser.email, role: mockCurrentUser.role },
        { secret: 'refresh-secret', expiresIn: '7d' }
      );
    });
  });
});
