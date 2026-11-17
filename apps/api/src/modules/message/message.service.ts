import { SocketEvents } from '@fidechat/shared';
import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { ChannelRepository } from '../channel/channel.repository.js';
import { SocketEmitter } from '../gateway/socket-emitter.js';
import { UserRepository } from '../user/user.repository.js';
import { BotConversationService } from './bot-conversation/bot-conversation.service.js';
import { type MessageCreationAttributes, MessageRepository } from './message.repository.js';

@Injectable()
export class MessageService {
    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly emitter: SocketEmitter,
        private readonly channelRepository: ChannelRepository,
        private readonly userRepository: UserRepository,
        private readonly conversation: BotConversationService,
    ) {}

    private async notifyMessageCreation(
        messageData: MessageCreationAttributes,
        messageId: string,
        guildId: string,
        createdAt: string,
    ): Promise<void> {
        const guildMembers = (await this.userRepository.getGuildUsers(guildId)).map((user) => user.id);

        this.emitter.emitToUsers(guildMembers, SocketEvents.MESSAGE_CREATE, {
            id: messageId,
            ...messageData,
            createdAt,
        });
    }

    async createMessage(data: MessageCreationAttributes) {
        const channel = await this.channelRepository.getChannel(data.channelId);
        if (!channel) {
            throw new NotFoundException('Channel not found');
        }
        const author = await this.userRepository.findById(data.authorId);
        if (!author) throw new NotFoundException('User not found');

        try {
            const createAt = new Date();
            const createdAtStr = createAt.toISOString();

            const result = await this.messageRepository.createMessage({
                ...data,
                createdAt: createAt,
            });

            await this.notifyMessageCreation(data, result.id, channel.guildId, createdAtStr);

            if (!author.isBot) {
                this.conversation.onHumanMessage(channel, result.id, data.content);
            }

            return result;
        } catch (error) {
            if (!(error instanceof HttpException)) {
                throw new InternalServerErrorException('Failed to create message', { cause: error });
            }
            throw error;
        }
    }

    async getMessage(id: string) {
        return this.messageRepository.getMessage(id);
    }

    async updateMessage(id: string, content: string, guildId: string) {
        try {
            const message = await this.getMessage(id);
            if (!message) throw new NotFoundException('Message not found');

            const result = await this.messageRepository.updateMessage(id, content);

            if (result.success) {
                const guildMembers = (await this.userRepository.getGuildUsers(guildId)).map((user) => user.id);
                this.emitter.emitToUsers(guildMembers, SocketEvents.MESSAGE_UPDATE, { id, content });
            }

            return result;
        } catch (error) {
            if (!(error instanceof HttpException)) {
                throw new InternalServerErrorException('Failed to update message', { cause: error });
            }
            throw error;
        }
    }

    async deleteMessage(id: string, guildId: string) {
        try {
            const message = await this.getMessage(id);
            if (!message) throw new NotFoundException('Message not found');

            const result = await this.messageRepository.deleteMessage(id);

            if (result.success) {
                const guildMembers = (await this.userRepository.getGuildUsers(guildId)).map((user) => user.id);
                this.emitter.emitToUsers(guildMembers, SocketEvents.MESSAGE_DELETE, {
                    id,
                    channelId: message.channelId,
                });
            }

            return result;
        } catch (error) {
            if (!(error instanceof HttpException)) {
                throw new InternalServerErrorException('Failed to delete message', { cause: error });
            }
            throw error;
        }
    }
}
