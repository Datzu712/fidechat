import { Body, Controller, Delete, Param, Patch, Post, ValidationPipe } from '@nestjs/common';

import { AuthenticatedUser } from '@/modules/auth/auth.decorators.js';

import { MessageDto } from './dto/message.dto.js';
import { MessageService } from './message.service.js';
@Controller({
    version: '1',
    path: 'guilds/:guildId/channels/:channelId/messages',
})
export class MessageController {
    constructor(private readonly messageService: MessageService) {}

    @Post()
    async createMessage(
        @Param('guildId') guildId: string,
        @Param('channelId') channelId: string,
        @AuthenticatedUser() user: IReqUser,
        @Body(
            new ValidationPipe({
                transform: true,
                transformOptions: { enableImplicitConversion: true },
                whitelist: true,
                groups: ['create'],
            }),
        )
        body: MessageDto,
    ) {
        return this.messageService.createMessage(guildId, {
            content: body.content,
            channelId,
            authorId: user.sub,
        });
    }

    @Patch(':messageId')
    async updateMessage(
        @Param('messageId') messageId: string,
        @Param('channelId') channelId: string,
        @Param('guildId') guildId: string,
        @AuthenticatedUser() user: IReqUser,
        @Body(
            new ValidationPipe({
                transform: true,
                transformOptions: { enableImplicitConversion: true },
                whitelist: true,
                groups: ['update'],
            }),
        )
        body: MessageDto,
    ) {
        return this.messageService.updateMessage({
            guildId,
            channelId,
            messageId,
            userId: user.sub,
            content: body.content,
        });
    }

    @Delete(':messageId')
    async deleteMessage(
        @Param('messageId') messageId: string,
        @Param('channelId') channelId: string,
        @Param('guildId') guildId: string,
        @AuthenticatedUser() user: IReqUser,
    ) {
        return this.messageService.deleteMessage({ guildId, channelId, messageId, userId: user.sub });
    }
}
