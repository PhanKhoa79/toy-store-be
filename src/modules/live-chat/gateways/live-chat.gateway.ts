import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class LiveChatGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('chat:join')
  join(@MessageBody() conversationId: string) {
    return { event: 'chat:joined', data: { conversationId } };
  }

  emitConversationUpdated(conversationId: string) {
    this.server.emit('chat:conversation-updated', { conversationId });
  }
}
