import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '@/common/exceptions/api.exception';
import { createPaginationMeta } from '@/common/utils/pagination.util';
import type { CurrentUser } from '@/common/contracts';
import { AdminListConversationsQueryDto, CreateConversationDto, SendChatMessageDto } from '@/modules/live-chat/dto/live-chat.dto';
import { LiveChatRepository } from '@/modules/live-chat/repositories/live-chat.repository';

@Injectable()
export class LiveChatService {
  constructor(private readonly repository: LiveChatRepository) {}

  async createConversation(dto: CreateConversationDto, user?: CurrentUser) {
    return this.repository.create({
      customer: user?.role === 'customer' ? { connect: { id: user.id } } : undefined,
      guestName: user ? user.fullName : dto.guestName,
      guestEmail: user ? user.email : dto.guestEmail,
      subject: dto.subject,
      status: 'open',
      lastMessageAt: new Date(),
      messages: { create: { senderId: user?.id, senderRole: user?.role ?? 'guest', message: dto.message } }
    });
  }

  async sendMessage(conversationId: string, dto: SendChatMessageDto, user?: CurrentUser) {
    const conversation = await this.repository.findById(conversationId);
    if (!conversation) throw new ApiException('CHAT_CONVERSATION_NOT_FOUND', 'Không tìm thấy hội thoại.', HttpStatus.NOT_FOUND);
    if (conversation.status === 'closed') throw new ApiException('CHAT_CONVERSATION_CLOSED', 'Hội thoại đã đóng.', HttpStatus.BAD_REQUEST);
    await this.repository.createMessage({ conversation: { connect: { id: conversationId } }, ...(user ? { sender: { connect: { id: user.id } } } : {}), senderRole: user?.role ?? 'guest', message: dto.message });
    return this.repository.update(conversationId, { lastMessageAt: new Date(), status: 'open' });
  }

  async listAdminConversations(query: AdminListConversationsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ChatConversationWhereInput = {};
    if (query.status) where.status = query.status;
    const [total, conversations] = await Promise.all([this.repository.count(where), this.repository.findMany(where, page, pageSize)]);
    return { data: conversations, meta: createPaginationMeta(page, pageSize, total) };
  }

  async getConversation(id: string) {
    const conversation = await this.repository.findById(id);
    if (!conversation) throw new ApiException('CHAT_CONVERSATION_NOT_FOUND', 'Không tìm thấy hội thoại.', HttpStatus.NOT_FOUND);
    return conversation;
  }

  async getMessages(conversationId: string) {
    await this.getConversation(conversationId);
    return this.repository.findMessages(conversationId);
  }

  reply(conversationId: string, dto: SendChatMessageDto, user: CurrentUser) {
    return this.sendMessage(conversationId, dto, user);
  }

  async close(conversationId: string) {
    await this.getConversation(conversationId);
    return this.repository.update(conversationId, { status: 'closed', closedAt: new Date() });
  }

  async reopen(conversationId: string) {
    await this.getConversation(conversationId);
    return this.repository.update(conversationId, { status: 'open', closedAt: null });
  }
}
