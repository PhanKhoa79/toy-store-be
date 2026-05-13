import { Module } from '@nestjs/common';
import { AdminLiveChatController } from '@/modules/live-chat/controllers/admin-live-chat.controller';
import { LiveChatController } from '@/modules/live-chat/controllers/live-chat.controller';
import { LiveChatGateway } from '@/modules/live-chat/gateways/live-chat.gateway';
import { LiveChatRepository } from '@/modules/live-chat/repositories/live-chat.repository';
import { LiveChatService } from '@/modules/live-chat/services/live-chat.service';

@Module({
  controllers: [LiveChatController, AdminLiveChatController],
  providers: [LiveChatService, LiveChatRepository, LiveChatGateway]
})
export class LiveChatModule {}
