import { SocketEvents } from '@fidechat/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { ChannelRepository } from '../channel/channel.repository.js';
import { GuildEmitter } from '../user/guild-emitter.js';
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
        private readonly channelRepository: ChannelRepository,
        private readonly userRepository: UserRepository,
        private readonly guildEmitter: GuildEmitter,
        private readonly conversation: BotConversationService,
    ) {}

    /** Members of the guild may post in its channels. */
    async createMessage(guildId: string, data: MessageCreationAttributes) {
        const channel = await this.channelRepository.getChannel(data.channelId);
        // A channel addressed through another guild does not exist there.
        if (channel?.guildId !== guildId) throw new NotFoundException('Channel not found');

        await this.assertGuildMember(guildId, data.authorId);

        const author = await this.userRepository.findById(data.authorId);
        if (!author) throw new NotFoundException('User not found');

        const createdAt = new Date();
        const { id } = await this.messageRepository.createMessage({ ...data, createdAt });

        await this.guildEmitter.emitToGuild(guildId, SocketEvents.MESSAGE_CREATE, {
            id,
            ...data,
            createdAt: createdAt.toISOString(),
        });

        if (!author.isBot) {
            this.conversation.onHumanMessage(channel, id, data.content);
        }

        return { id };
    }

    /**
     * The message the route points to, if the user wrote it. A message outside the route's guild or
     * channel is not found; someone else's is forbidden.
     */
    private async getOwnMessage({ guildId, channelId, messageId, userId }: MessageAction): Promise<Message> {
        const message = await this.messageRepository.getMessage(messageId);
        if (message?.channelId !== channelId) throw new NotFoundException('Message not found');

        const channel = await this.channelRepository.getChannel(channelId);
        if (channel?.guildId !== guildId) throw new NotFoundException('Message not found');

        if (message.authorId !== userId) throw new ForbiddenException('Only the author can change this message');

        return message;
    }

    async updateMessage({ content, ...action }: MessageAction & { content: string }) {
        await this.getOwnMessage(action);

        const { messageId: id, guildId } = action;
        const result = await this.messageRepository.updateMessage(id, content);
        if (result.success) {
            await this.guildEmitter.emitToGuild(guildId, SocketEvents.MESSAGE_UPDATE, { id, content });
        }

        return result;
    }

    async deleteMessage(action: MessageAction) {
        const message = await this.getOwnMessage(action);

        const { messageId: id, guildId } = action;
        const result = await this.messageRepository.deleteMessage(id);
        if (result.success) {
            await this.guildEmitter.emitToGuild(guildId, SocketEvents.MESSAGE_DELETE, {
                id,
                channelId: message.channelId,
            });
        }

        return result;
    }

    private async assertGuildMember(guildId: string, userId: string): Promise<void> {
        const isMember = await this.userRepository.isGuildMember(guildId, userId);
        if (!isMember) throw new ForbiddenException('Not a member of this guild');
    }
}
