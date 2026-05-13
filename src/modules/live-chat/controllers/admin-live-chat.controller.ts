import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '@/common/decorators/api-standard-response.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { CurrentUser } from '@/common/contracts';
import { AdminListConversationsQueryDto, SendChatMessageDto } from '@/modules/live-chat/dto/live-chat.dto';
import { LiveChatService } from '@/modules/live-chat/services/live-chat.service';

@ApiTags('live-chat')
@ApiCookieAuth('access_token')
@Roles('staff', 'admin')
@Controller('admin/chat/conversations')
export class AdminLiveChatController {
  constructor(private readonly liveChatService: LiveChatService) {}

  @Get()
  @Permissions({ module: 'live-chat', action: 'view' })
  @ApiOperation({ summary: 'List admin live chat conversations' })
  @ApiOkResponse({ description: 'Paginated conversations' })
  @ApiStandardErrors()
  list(@Query() query: AdminListConversationsQueryDto) {
    return this.liveChatService.listAdminConversations(query);
  }

  @Get(':id')
  @Permissions({ module: 'live-chat', action: 'view' })
  @ApiOperation({ summary: 'Get live chat conversation detail' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Conversation detail' })
  @ApiStandardErrors()
  get(@Param('id') id: string) {
    return this.liveChatService.getConversation(id);
  }

  @Post(':id/messages')
  @Permissions({ module: 'live-chat', action: 'reply' })
  @ApiOperation({ summary: 'Reply live chat conversation' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Reply sent' })
  @ApiStandardErrors()
  reply(@Param('id') id: string, @Body() dto: SendChatMessageDto, @CurrentUserDecorator() user: CurrentUser) {
    return this.liveChatService.reply(id, dto, user);
  }

  @Patch(':id/close')
  @Permissions({ module: 'live-chat', action: 'update' })
  @ApiOperation({ summary: 'Close live chat conversation' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Conversation closed' })
  @ApiStandardErrors()
  close(@Param('id') id: string) {
    return this.liveChatService.close(id);
  }

  @Patch(':id/reopen')
  @Permissions({ module: 'live-chat', action: 'update' })
  @ApiOperation({ summary: 'Reopen live chat conversation' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Conversation reopened' })
  @ApiStandardErrors()
  reopen(@Param('id') id: string) {
    return this.liveChatService.reopen(id);
  }
}
