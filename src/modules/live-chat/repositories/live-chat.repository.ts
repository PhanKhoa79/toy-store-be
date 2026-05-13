import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

const conversationInclude = { customer: { select: { id: true, fullName: true, email: true } }, messages: { orderBy: { createdAt: 'asc' as const } } };

@Injectable()
export class LiveChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.ChatConversationWhereInput) { return this.prisma.chatConversation.count({ where }); }
  findMany(where: Prisma.ChatConversationWhereInput, page: number, pageSize: number) { return this.prisma.chatConversation.findMany({ where, include: conversationInclude, orderBy: { lastMessageAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }); }
  findById(id: string) { return this.prisma.chatConversation.findUnique({ where: { id }, include: conversationInclude }); }
  findMessages(conversationId: string) { return this.prisma.chatMessage.findMany({ where: { conversationId }, include: { sender: { select: { id: true, fullName: true, email: true, role: true } } }, orderBy: { createdAt: 'asc' } }); }
  create(data: Prisma.ChatConversationCreateInput) { return this.prisma.chatConversation.create({ data, include: conversationInclude }); }
  createMessage(data: Prisma.ChatMessageCreateInput) { return this.prisma.chatMessage.create({ data }); }
  update(id: string, data: Prisma.ChatConversationUpdateInput) { return this.prisma.chatConversation.update({ where: { id }, data, include: conversationInclude }); }
}
