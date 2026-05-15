import { Test, TestingModule } from '@nestjs/testing';
import { LiveChatService } from './live-chat.service';
import { LiveChatRepository } from '../repositories/live-chat.repository';
import { ApiException } from '@/common/exceptions/api.exception';

describe('LiveChatService', () => {
  let service: LiveChatService;
  let repository: jest.Mocked<LiveChatRepository>;

  const mockConversation = {
    id: 'conv-id',
    status: 'pending',
    guestName: 'Guest',
    guestEmail: 'guest@example.com',
    subject: 'Help',
    lastMessageAt: new Date(),
    messages: [],
    customer: null
  };

  const mockUser = { id: 'user-id', email: 'customer@example.com', fullName: 'Customer', role: 'customer', isActive: true, permissions: [] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveChatService,
        {
          provide: LiveChatRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findMessages: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            createMessage: jest.fn(),
            update: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<LiveChatService>(LiveChatService);
    repository = module.get(LiveChatRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createConversation', () => {
    it('should create conversation with pending status for guest', async () => {
      repository.create.mockResolvedValue(mockConversation as any);
      const result = await service.createConversation({ guestName: 'Guest', guestEmail: 'guest@example.com', subject: 'Help', message: 'Hello' });
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
      expect(result.status).toBe('pending');
    });

    it('should create conversation with pending status for customer', async () => {
      repository.create.mockResolvedValue({ ...mockConversation, customer: { id: 'user-id', fullName: 'Customer', email: 'customer@example.com' } } as any);
      const result = await service.createConversation({ subject: 'Help', message: 'Hello' }, mockUser as any);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', guestName: 'Customer', guestEmail: 'customer@example.com' }));
    });
  });

  describe('sendMessage', () => {
    it('should send message and update status to open', async () => {
      repository.findById.mockResolvedValue(mockConversation as any);
      repository.createMessage.mockResolvedValue({} as any);
      repository.update.mockResolvedValue({ ...mockConversation, status: 'open' } as any);
      const result = await service.sendMessage('conv-id', { message: 'Hello' });
      expect(repository.createMessage).toHaveBeenCalled();
      expect(result.status).toBe('open');
    });

    it('should throw CHAT_CONVERSATION_CLOSED when conversation is closed', async () => {
      repository.findById.mockResolvedValue({ ...mockConversation, status: 'closed' } as any);
      await expect(service.sendMessage('conv-id', { message: 'Hello' })).rejects.toMatchObject({ response: { code: 'CHAT_CONVERSATION_CLOSED' } });
    });

    it('should throw CHAT_CONVERSATION_NOT_FOUND when conversation missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.sendMessage('conv-id', { message: 'Hello' })).rejects.toMatchObject({ response: { code: 'CHAT_CONVERSATION_NOT_FOUND' } });
    });
  });

  describe('listAdminConversations', () => {
    it('should return paginated conversations', async () => {
      repository.count.mockResolvedValue(1);
      repository.findMany.mockResolvedValue([mockConversation] as any);
      const result = await service.listAdminConversations({ page: 1, pageSize: 20 } as any);
      expect(result.data).toHaveLength(1);
      expect(result.meta).toBeDefined();
    });
  });

  describe('getConversation', () => {
    it('should return conversation by id', async () => {
      repository.findById.mockResolvedValue(mockConversation as any);
      const result = await service.getConversation('conv-id');
      expect(result).toEqual(mockConversation);
    });

    it('should throw CHAT_CONVERSATION_NOT_FOUND when missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getConversation('conv-id')).rejects.toMatchObject({ response: { code: 'CHAT_CONVERSATION_NOT_FOUND' } });
    });
  });

  describe('getMessages', () => {
    it('should return messages for conversation', async () => {
      repository.findById.mockResolvedValue(mockConversation as any);
      repository.findMessages.mockResolvedValue([{ id: 'msg-1', message: 'Hello' }] as any);
      const result = await service.getMessages('conv-id');
      expect(result).toHaveLength(1);
    });
  });

  describe('reply', () => {
    it('should allow staff/admin to reply', async () => {
      repository.findById.mockResolvedValue(mockConversation as any);
      repository.createMessage.mockResolvedValue({} as any);
      repository.update.mockResolvedValue({ ...mockConversation, status: 'open' } as any);
      const result = await service.reply('conv-id', { message: 'Staff reply' }, { ...mockUser, role: 'staff' } as any);
      expect(result.status).toBe('open');
    });
  });

  describe('close', () => {
    it('should close conversation', async () => {
      repository.findById.mockResolvedValue(mockConversation as any);
      repository.update.mockResolvedValue({ ...mockConversation, status: 'closed' } as any);
      const result = await service.close('conv-id');
      expect(repository.update).toHaveBeenCalledWith('conv-id', { status: 'closed', closedAt: expect.any(Date) });
      expect(result.status).toBe('closed');
    });
  });

  describe('reopen', () => {
    it('should reopen conversation', async () => {
      repository.findById.mockResolvedValue({ ...mockConversation, status: 'closed' } as any);
      repository.update.mockResolvedValue({ ...mockConversation, status: 'open' } as any);
      const result = await service.reopen('conv-id');
      expect(repository.update).toHaveBeenCalledWith('conv-id', { status: 'open', closedAt: null });
      expect(result.status).toBe('open');
    });
  });
});
