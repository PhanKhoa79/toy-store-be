import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { CurrentUser } from '@/common/contracts';
import { CreateConversationDto, SendChatMessageDto } from '@/modules/live-chat/dto/live-chat.dto';
import { LiveChatService } from '@/modules/live-chat/services/live-chat.service';

@ApiTags('live-chat')
@Controller('chat')
export class LiveChatController {
  constructor(private readonly liveChatService: LiveChatService) {}

  @Public()
  @Post('conversations')
  @ApiOperation({ summary: 'Create live chat conversation' })
  @ApiCreatedResponse({ description: 'Created conversation' })
  @ApiStandardErrors()
  create(@Body() dto: CreateConversationDto, @CurrentUserDecorator() user?: CurrentUser) {
    return this.liveChatService.createConversation(dto, user);
  }

  @Public()
  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get live chat conversation messages' })
  @ApiParam({ name: 'conversationId' })
  @ApiOkResponse({ description: 'Conversation messages' })
  @ApiStandardErrors()
  messages(@Param('conversationId') conversationId: string) {
    return this.liveChatService.getMessages(conversationId);
  }

  @Public()
  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send live chat message' })
  @ApiParam({ name: 'conversationId' })
  @ApiOkResponse({ description: 'Message sent' })
  @ApiStandardErrors()
  send(@Param('conversationId') conversationId: string, @Body() dto: SendChatMessageDto, @CurrentUserDecorator() user?: CurrentUser) {
    return this.liveChatService.sendMessage(conversationId, dto, user);
  }
}
