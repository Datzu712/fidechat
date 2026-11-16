import { SocketEvents } from '@fidechat/shared';
import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { AIService } from '../ai/ai.service.js';
import { detectBot } from '../ai/bots.js';
import { Channel, ChannelRepository } from '../channel/channel.repository.js';
import { PresenceService } from '../gateway/presence.service.js';
import { SocketEmitter } from '../gateway/socket-emitter.js';
import { UserRepository } from '../user/user.repository.js';
import { type MessageCreationAttributes, MessageRepository } from './message.repository.js';

/** How many channel messages a bot reads before replying. */
const AI_HISTORY_LIMIT = 30;

@Injectable()
export class MessageService {
    private readonly logger = new Logger('MessageService');

    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly emitter: SocketEmitter,
        private readonly presence: PresenceService,
        private readonly channelRepository: ChannelRepository,
        private readonly userRepository: UserRepository,
        private readonly ai: AIService,
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
                void this.handleAIResponse(data, channel);
            }

            return result;
        } catch (error) {
            if (!(error instanceof HttpException)) {
                throw new InternalServerErrorException('Failed to create message', { cause: error });
            }
            throw error;
        }
    }

    private async handleAIResponse(originalMessage: MessageCreationAttributes, channel: Channel): Promise<void> {
        if (!this.ai.enabled) return;

        const bot = detectBot(originalMessage.content);
        if (!bot) return;

        this.presence.startBotTyping(bot.user.id, channel.id);

        try {
            // The triggering message is already stored, so it is the last entry.
            const history = await this.messageRepository.getRecentMessages(channel.id, AI_HISTORY_LIMIT);
            const content = await this.ai.reply(bot, history);
            if (!content) return;

            const createdAt = new Date();
            const reply = { content, channelId: channel.id, authorId: bot.user.id };
            const aiMessage = await this.messageRepository.createMessage({ ...reply, createdAt });

            await this.notifyMessageCreation(reply, aiMessage.id, channel.guildId, createdAt.toISOString());
        } catch (error) {
            this.logger.error(new Error(`Error generating the ${bot.user.username} reply`, { cause: error }));
        } finally {
            this.presence.stopBotTyping(bot.user.id);
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
