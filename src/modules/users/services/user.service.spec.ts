import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { ApiException } from '@/common/exceptions/api.exception';

jest.mock('argon2');

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 'user-id',
    email: 'staff@example.com',
    fullName: 'Staff User',
    phone: '0900000000',
    role: 'staff',
    isActive: true,
    lockedAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            count: jest.fn(),
            findMany: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            countActiveAdmins: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            listPermissions: jest.fn(),
            updatePermissions: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(UserRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listUsers', () => {
    it('should return paginated staff/admin users', async () => {
      repository.count.mockResolvedValue(1);
      repository.findMany.mockResolvedValue([mockUser] as any);
      const result = await service.listUsers({ page: 1, pageSize: 20 } as any);
      expect(result.data).toHaveLength(1);
      expect(result.meta).toBeDefined();
    });

    it('should filter by role when provided', async () => {
      repository.count.mockResolvedValue(1);
      repository.findMany.mockResolvedValue([mockUser] as any);
      await service.listUsers({ page: 1, pageSize: 20, role: 'staff' } as any);
      expect(repository.findMany).toHaveBeenCalledWith(expect.objectContaining({ role: 'staff' }), 1, 20);
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      repository.findByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      repository.create.mockResolvedValue(mockUser as any);
      const result = await service.createUser({ email: 'new@example.com', password: 'Password123!', fullName: 'New', phone: '0900000000', role: 'staff' } as any);
      expect(argon2.hash).toHaveBeenCalledWith('Password123!');
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw USER_EMAIL_ALREADY_EXISTS for duplicate email', async () => {
      repository.findByEmail.mockResolvedValue(mockUser as any);
      await expect(service.createUser({ email: 'staff@example.com', password: 'Password123!', fullName: 'New', role: 'staff' } as any)).rejects.toMatchObject({ response: { code: 'USER_EMAIL_ALREADY_EXISTS' } });
    });
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      repository.findById.mockResolvedValue(mockUser as any);
      const result = await service.getUser('user-id');
      expect(result).toEqual(mockUser);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getUser('user-id')).rejects.toMatchObject({ response: { code: 'USER_NOT_FOUND' } });
    });

    it('should throw USER_NOT_FOUND for customer role', async () => {
      repository.findById.mockResolvedValue({ ...mockUser, role: 'customer' } as any);
      await expect(service.getUser('user-id')).rejects.toMatchObject({ response: { code: 'USER_NOT_FOUND' } });
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      repository.findById.mockResolvedValue(mockUser as any);
      repository.findByEmail.mockResolvedValue(null);
      repository.countActiveAdmins.mockResolvedValue(1);
      repository.update.mockResolvedValue({ ...mockUser, fullName: 'Updated' } as any);
      const result = await service.updateUser('user-id', { fullName: 'Updated' } as any);
      expect(repository.update).toHaveBeenCalled();
    });

    it('should hash password when updating password', async () => {
      repository.findById.mockResolvedValue(mockUser as any);
      repository.findByEmail.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed');
      repository.update.mockResolvedValue(mockUser as any);
      await service.updateUser('user-id', { password: 'NewPass123!' } as any);
      expect(argon2.hash).toHaveBeenCalledWith('NewPass123!');
    });

    it('should throw USER_EMAIL_ALREADY_EXISTS for duplicate email', async () => {
      repository.findById.mockResolvedValue(mockUser as any);
      repository.findByEmail.mockResolvedValue({ ...mockUser, id: 'other-id' } as any);
      await expect(service.updateUser('user-id', { email: 'other@example.com' } as any)).rejects.toMatchObject({ response: { code: 'USER_EMAIL_ALREADY_EXISTS' } });
    });

    it('should throw USER_LAST_ADMIN_LOCKED when disabling last admin', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      repository.findById.mockResolvedValue(adminUser as any);
      repository.countActiveAdmins.mockResolvedValue(0);
      await expect(service.updateUser('user-id', { isActive: false } as any)).rejects.toMatchObject({ response: { code: 'USER_LAST_ADMIN_LOCKED' } });
    });

    it('should throw USER_LAST_ADMIN_LOCKED when demoting last admin', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      repository.findById.mockResolvedValue(adminUser as any);
      repository.countActiveAdmins.mockResolvedValue(0);
      await expect(service.updateUser('user-id', { role: 'staff' } as any)).rejects.toMatchObject({ response: { code: 'USER_LAST_ADMIN_LOCKED' } });
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions for staff user', async () => {
      repository.findById.mockResolvedValue(mockUser as any);
      repository.updatePermissions.mockResolvedValue({ ...mockUser, userPermissions: [] } as any);
      const result = await service.updatePermissions('user-id', { permissionIds: ['perm-1'] }, 'actor-id');
      expect(repository.updatePermissions).toHaveBeenCalledWith('user-id', ['perm-1']);
    });

    it('should throw USER_CANNOT_MODIFY_SELF_PERMISSION when actor modifies self', async () => {
      await expect(service.updatePermissions('user-id', { permissionIds: [] }, 'user-id')).rejects.toMatchObject({ response: { code: 'USER_CANNOT_MODIFY_SELF_PERMISSION' } });
    });

    it('should skip permission update for admin user', async () => {
      repository.findById.mockResolvedValue({ ...mockUser, role: 'admin' } as any);
      const result = await service.updatePermissions('user-id', { permissionIds: ['perm-1'] }, 'actor-id');
      expect(repository.updatePermissions).not.toHaveBeenCalled();
      expect(result!.role).toBe('admin');
    });
  });

  describe('listPermissions', () => {
    it('should return all permissions', async () => {
      repository.listPermissions.mockResolvedValue([{ id: 'p1', module: 'order', action: 'view', description: '' }] as any);
      const result = await service.listPermissions();
      expect(result).toHaveLength(1);
    });
  });
});
