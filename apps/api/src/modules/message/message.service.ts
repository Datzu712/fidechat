import { type Message as WireMessage, SocketEvents } from '@fidechat/shared';
import {
    ForbiddenException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';

import { ChannelRepository } from '../channel/channel.repository.js';
import { SocketEmitter } from '../gateway/socket-emitter.js';
import { UserRepository } from '../user/user.repository.js';
import { BotConversationService } from './bot-conversation/bot-conversation.service.js';
import { type Message, type MessageCreationAttributes, MessageRepository } from './message.repository.js';

/** A user acting on the message at `/guilds/:guildId/channels/:channelId/messages/:messageId`. */
export interface MessageAction {
    guildId: string;
    channelId: string;
    messageId: string;
    userId: string;
}

@Injectable()
export class MessageService {
    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly emitter: SocketEmitter,
        private readonly channelRepository: ChannelRepository,
        private readonly userRepository: UserRepository,
        private readonly conversation: BotConversationService,
    ) {}

    private async notifyMessageCreation(guildId: string, message: WireMessage): Promise<void> {
        const guildMembers = (await this.userRepository.getGuildUsers(guildId)).map((user) => user.id);

        this.emitter.emitToUsers(guildMembers, SocketEvents.MESSAGE_CREATE, message);
    }

    /** Members of the guild may post in its channels. */
    async createMessage(guildId: string, data: MessageCreationAttributes) {
        const channel = await this.channelRepository.getChannel(data.channelId);
        // A channel addressed through another guild does not exist there.
        if (!channel || channel.guildId !== guildId) {
            throw new NotFoundException('Channel not found');
        }
        await this.assertGuildMember(guildId, data.authorId);

        const author = await this.userRepository.findById(data.authorId);
        if (!author) throw new NotFoundException('User not found');

        try {
            const createAt = new Date();
            const createdAtStr = createAt.toISOString();

            const result = await this.messageRepository.createMessage({
                ...data,
                createdAt: createAt,
            });

            await this.notifyMessageCreation(channel.guildId, { id: result.id, ...data, createdAt: createdAtStr });

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

    /**
     * The message the route points to, if the user wrote it. A message outside the route's guild or
     * channel is not found; someone else's is forbidden.
     */
    private async getOwnMessage({ guildId, channelId, messageId, userId }: MessageAction): Promise<Message> {
        const message = await this.getMessage(messageId);
        if (message?.channelId !== channelId) throw new NotFoundException('Message not found');

        const channel = await this.channelRepository.getChannel(channelId);
        if (channel?.guildId !== guildId) throw new NotFoundException('Message not found');

        if (message.authorId !== userId) throw new ForbiddenException('Only the author can change this message');

        return message;
    }

    async updateMessage({ content, ...action }: MessageAction & { content: string }) {
        const { guildId, messageId: id } = action;
        try {
            await this.getOwnMessage(action);

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

    async deleteMessage(action: MessageAction) {
        const { guildId, messageId: id } = action;
        try {
            const message = await this.getOwnMessage(action);

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

    private async assertGuildMember(guildId: string, userId: string): Promise<void> {
        const isMember = await this.userRepository.isGuildMember(guildId, userId);
        if (!isMember) throw new ForbiddenException('Not a member of this guild');
    }
}
