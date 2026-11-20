import { SocketEvents } from '@fidechat/shared';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { AIService } from '../../ai/ai.service.js';
import { type AIBot, detectNamedBots } from '../../ai/bots.js';
import type { ChannelHistoryEntry } from '../../ai/prompt.js';
import { ROUTER_HISTORY_LIMIT } from '../../ai/router.js';
import { type SpeakerPlan, SpeakerSelector } from '../../ai/speaker-selector.js';
import type { Channel } from '../../channel/channel.repository.js';
import { PresenceService } from '../../gateway/presence.service.js';
import { GuildEmitter } from '../../user/guild-emitter.js';
import { MessageRepository } from '../message.repository.js';
import {
    AI_HISTORY_LIMIT,
    type BotCycle,
    type ChannelConversation,
    DEBOUNCE_MS,
    READ_PAUSE_MS,
    sleep,
    typingDelayMs,
} from './bot-conversation.util.js';

/**
 * Runs the bots' side of a channel conversation. Human messages are debounced into a cycle; `SpeakerSelector` decides
 * who speaks in it, and this service does the pacing: the addressed bots reply at once, the spontaneous ones in turns
 * after them, and one other bot may react.
 */
@Injectable()
export class BotConversationService implements OnModuleDestroy {
    private readonly logger = new Logger(BotConversationService.name);
    private readonly conversations = new Map<string, ChannelConversation>();
    private destroyed = false;

    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly ai: AIService,
        private readonly selector: SpeakerSelector,
        private readonly presence: PresenceService,
        private readonly guildEmitter: GuildEmitter,
    ) {}

    onModuleDestroy(): void {
        this.destroyed = true;
        for (const conversation of this.conversations.values()) {
            clearTimeout(conversation.timer);
        }
    }

    /** Only human messages reach this, so named-bot detection never runs over bot replies. */
    onHumanMessage(channel: Channel, messageId: string, content: string): void {
        if (!this.ai.enabled || this.destroyed) return;

        const conversation = this.conversationOf(channel.id);
        conversation.pending.push({ id: messageId, content });

        clearTimeout(conversation.timer);
        conversation.timer = setTimeout(() => {
            conversation.timer = undefined;
            conversation.chain = conversation.chain.then(async () => this.runCycle(channel, conversation));
        }, DEBOUNCE_MS);
    }

    private conversationOf(channelId: string): ChannelConversation {
        let conversation = this.conversations.get(channelId);
        if (!conversation) {
            conversation = { pending: [], chain: Promise.resolve() };
            this.conversations.set(channelId, conversation);
        }
        return conversation;
    }

    private async runCycle(channel: Channel, conversation: ChannelConversation): Promise<void> {
        // A newer message's timer will queue its own cycle, and that one takes the pending messages after their silence.
        if (this.destroyed || conversation.timer !== undefined || conversation.pending.length === 0) return;

        const pending = conversation.pending;
        conversation.pending = [];

        const cycle: BotCycle = {
            channel,
            conversation,
            ids: new Set(pending.map((message) => message.id)),
            named: [...new Set(pending.flatMap((message) => detectNamedBots(message.content)))],
            spoken: [],
        };

        try {
            const plan = await this.selector.plan(channel.id, await this.routerHistory(cycle), cycle.ids, cycle.named);

            await this.answerAddressed(cycle, plan.addressed);
            await this.speakInTurns(cycle, plan.spontaneous);
            if (plan.routed && cycle.spoken.length > 0) await this.react(cycle);

            this.logCycle(cycle, plan);
        } catch (error) {
            this.logger.error(new Error(`Bot conversation cycle failed in channel ${channel.id}`, { cause: error }));
        }
    }

    /** A human wrote after the cycle started: that message waits in `pending` for the next cycle. */
    private interrupted({ conversation }: BotCycle): boolean {
        return conversation.pending.length > 0;
    }

    /** Nothing new starts after a destroy or a human interrupt. Only the bots a human named are exempt from the latter. */
    private stopped(cycle: BotCycle): boolean {
        return this.destroyed || this.interrupted(cycle);
    }

    /** The addressed bots reply in parallel, each posting when ready, so they do not see each other. */
    private async answerAddressed(cycle: BotCycle, bots: readonly AIBot[]): Promise<void> {
        if (this.destroyed) return;

        // A human may have interrupted while the router decided: the bots that human named still answer.
        const answering = this.interrupted(cycle) ? bots.filter((bot) => cycle.named.includes(bot)) : bots;
        await Promise.all(answering.map(async (bot) => this.speak(cycle, bot)));
    }

    /** The spontaneous bots reply one after another, after the addressed ones, so each sees the replies before it. */
    private async speakInTurns(cycle: BotCycle, bots: readonly AIBot[]): Promise<void> {
        for (const bot of bots) {
            if (this.stopped(cycle)) return;

            // After other replies, the bot pauses to read them. They may have changed things: the router must still
            // pick it, with the latest history.
            if (cycle.spoken.length > 0) {
                await sleep(READ_PAUSE_MS);
                if (this.stopped(cycle)) return;

                const stillPicked = await this.selector.stillPicks(bot, await this.routerHistory(cycle), cycle.ids);
                if (this.stopped(cycle)) return;
                if (!stillPicked) continue;
            }

            // Cycles in a channel never overlap, so no other reply of this bot can slip in before the cap is recorded.
            const posted = await this.speak(cycle, bot);
            if (posted) this.selector.recordSpontaneous(cycle.channel.id, bot);
        }
    }

    /** At most one bot that has not spoken yet reacts to the replies, under its spontaneous cap. */
    private async react(cycle: BotCycle): Promise<void> {
        if (this.stopped(cycle)) return;

        const history = await this.routerHistory(cycle);
        const bot = await this.selector.pickReaction(cycle.channel.id, history, cycle.ids, cycle.spoken);
        if (!bot || this.stopped(cycle)) return;

        await sleep(READ_PAUSE_MS);
        if (this.stopped(cycle)) return;

        const posted = await this.speak(cycle, bot, [...cycle.spoken]);
        if (posted) this.selector.recordSpontaneous(cycle.channel.id, bot);
    }

    private async routerHistory({ channel }: BotCycle): Promise<ChannelHistoryEntry[]> {
        return this.messageRepository.getRecentMessages(channel.id, ROUTER_HISTORY_LIMIT);
    }

    private logCycle({ channel, named, spoken }: BotCycle, { addressed, spontaneous, routed }: SpeakerPlan): void {
        const names = (bots: readonly AIBot[]) => bots.map((bot) => bot.user.username).join(', ') || 'none';
        this.logger.debug(
            `Channel ${channel.id}: router ${routed ? 'ok' : 'unavailable'}, named ${names(named)}, ` +
                `addressed ${names(addressed)}, spontaneous ${names(spontaneous)}, spoke ${names(spoken)}`,
        );
    }

    /**
     * Generates, stores and broadcasts one reply, and adds the bot to `cycle.spoken`. With `reactingTo`, the reply
     * comments on those bots' replies. The typing indicator stays on
     * until the reply is posted, paced like typing. Returns whether a message was posted.
     */
    private async speak(cycle: BotCycle, bot: AIBot, reactingTo?: readonly AIBot[]): Promise<boolean> {
        const { channel } = cycle;

        this.presence.startBotTyping(bot.user.id, channel.id);

        const startedAt = Date.now();
        try {
            const history = await this.messageRepository.getRecentMessages(channel.id, AI_HISTORY_LIMIT);
            const content = await this.ai.reply(bot, history, reactingTo);
            if (!content) return false;

            await sleep(typingDelayMs(content.length, Date.now() - startedAt));
            if (this.destroyed) return false;

            const createdAt = new Date();
            const reply = { content, channelId: channel.id, authorId: bot.user.id };
            const { id } = await this.messageRepository.createMessage({ ...reply, createdAt });

            await this.guildEmitter.emitToGuild(channel.guildId, SocketEvents.MESSAGE_CREATE, {
                id,
                ...reply,
                createdAt: createdAt.toISOString(),
            });
            cycle.spoken.push(bot);

            return true;
        } catch (error) {
            this.logger.error(new Error(`Error generating the ${bot.user.username} reply`, { cause: error }));
            return false;
        } finally {
            this.presence.stopBotTyping(bot.user.id, channel.id);
        }
    }
}
