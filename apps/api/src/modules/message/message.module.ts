import { Module } from '@nestjs/common';

import { AIModule } from '../ai/ai.module.js';
import { ChannelModule } from '../channel/channel.module.js';
import { GatewayModule } from '../gateway/gateway.module.js';
import { UserModule } from '../user/user.module.js';
import { BotConversationService } from './bot-conversation/bot-conversation.service.js';
import { MessageController } from './message.controller.js';
import { MessageRepository } from './message.repository.js';
import { MessageService } from './message.service.js';

@Module({
    controllers: [MessageController],
    providers: [MessageService, MessageRepository, BotConversationService],
    imports: [GatewayModule, ChannelModule, UserModule, AIModule],
})
export class MessageModule {}
