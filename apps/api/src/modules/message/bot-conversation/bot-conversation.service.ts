import { SocketEvents } from '@fidechat/shared';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { AIService } from '../../ai/ai.service.js';
import { type AIBot, detectNamedBots } from '../../ai/bots.js';
import { type PlannedSpeaker, planSpeakers, ROUTER_HISTORY_LIMIT } from '../../ai/router.js';
import { SpontaneousCaps } from '../../ai/spontaneous-caps.js';
import type { Channel } from '../../channel/channel.repository.js';
import { PresenceService } from '../../gateway/presence.service.js';
import { SocketEmitter } from '../../gateway/socket-emitter.js';
import { UserRepository } from '../../user/user.repository.js';
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
 * Decides which bots join a channel conversation. Human messages are debounced; then the router (or, without it,
 * the bots named in the new messages) picks the speakers: the addressed ones reply at once, the spontaneous ones in
 * turns after them, and one other bot may react.
 */
@Injectable()
export class BotConversationService implements OnModuleDestroy {
    private readonly logger = new Logger(BotConversationService.name);
    private readonly conversations = new Map<string, ChannelConversation>();
    private readonly caps = new SpontaneousCaps();
    private destroyed = false;

    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly ai: AIService,
        private readonly presence: PresenceService,
        private readonly userRepository: UserRepository,
        private readonly emitter: SocketEmitter,
    ) {}

    onModuleDestroy(): void {
        this.destroyed = true;
        for (const conversation of this.conversations.values()) {
            clearTimeout(conversation.timer);
        }
    }

    /**
     * Only human messages reach this, so named-bot detection never runs over bot replies.
     *
     * Note: this is channel scoped btw
     */
    onHumanMessage(channel: Channel, messageId: string, content: string): void {
        if (!this.ai.enabled || this.destroyed) return;

        let state = this.conversations.get(channel.id);
        if (!state) {
            state = { pending: [], interrupted: false, chain: Promise.resolve() };
            this.conversations.set(channel.id, state);
        }
        const conversation = state;

        conversation.pending.push({ id: messageId, content });
        conversation.interrupted = true;

        clearTimeout(conversation.timer);

        conversation.timer = setTimeout(() => {
            conversation.timer = undefined;
            conversation.chain = conversation.chain.then(async () => this.runCycle(channel, conversation));
        }, DEBOUNCE_MS);
    }

    private async runCycle(channel: Channel, conversation: ChannelConversation): Promise<void> {
        // A newer message's timer will queue its own cycle, and that one takes the pending messages after their silence.
        if (this.destroyed || conversation.timer !== undefined || conversation.pending.length === 0) return;

        const pending = conversation.pending;
        conversation.pending = [];
        conversation.interrupted = false;

        const cycle: BotCycle = {
            channel,
            conversation,
            ids: new Set(pending.map((message) => message.id)),
            named: [...new Set(pending.flatMap((message) => detectNamedBots(message.content)))],
            spoken: [],
        };

        try {
            const history = await this.messageRepository.getRecentMessages(channel.id, ROUTER_HISTORY_LIMIT);
            const decision = this.ai.routerEnabled ? await this.ai.route(history, cycle.ids) : null;
            const speakers = planSpeakers(decision, cycle.named, (bot) =>
                this.caps.canSpeak(channel.id, bot.user.id, Date.now()),
            );

            await this.takeTurns(cycle, speakers);
            if (decision !== null && cycle.spoken.length > 0) await this.react(cycle);

            const names = (bots: readonly AIBot[]) => bots.map((bot) => bot.user.username).join(', ') || 'none';
            const picks =
                decision === null
                    ? 'unavailable'
                    : decision.map(({ bot, kind }) => `${bot.user.username} (${kind})`).join(', ') || 'none';
            this.logger.debug(
                `Channel ${channel.id}: router ${picks}, named ${names(cycle.named)}, spoke ${names(cycle.spoken)}`,
            );
        } catch (error) {
            this.logger.error(new Error(`Bot conversation cycle failed in channel ${channel.id}`, { cause: error }));
        }
    }

    /** Destroy stops every remaining turn; a human interrupt only the turns of bots nobody named. */
    private isSilenced({ conversation, named }: BotCycle, bot: AIBot): boolean {
        return this.destroyed || (conversation.interrupted && !named.includes(bot));
    }

    /**
     * The leading addressed speakers reply in parallel; the speakers after them reply one after another. A human
     * interrupt skips the bots nobody named that have not started yet, but named bots still answer.
     */
    private async takeTurns(cycle: BotCycle, speakers: PlannedSpeaker[]): Promise<void> {
        const firstTurn = speakers.findIndex(({ kind }) => kind !== 'addressed');
        const together = firstTurn === -1 ? speakers.length : firstTurn;

        await Promise.all(
            speakers.slice(0, together).map(async ({ bot }) => {
                if (!this.isSilenced(cycle, bot)) await this.speak(cycle, bot);
            }),
        );

        for (const speaker of speakers.slice(together)) {
            await this.takeTurn(cycle, speaker);
        }
    }

    /**
     * One sequential turn. After other replies, the bot first pauses to read them and, if nobody addressed it, the
     * router must still pick it.
     */
    private async takeTurn(cycle: BotCycle, { bot, kind }: PlannedSpeaker): Promise<void> {
        if (this.isSilenced(cycle, bot)) return;

        if (cycle.spoken.length > 0) {
            await sleep(READ_PAUSE_MS);

            if (this.isSilenced(cycle, bot)) return;

            if (kind === 'spontaneous') {
                // The replies may have changed things: the router must still pick it, with the latest history.
                const history = await this.messageRepository.getRecentMessages(cycle.channel.id, ROUTER_HISTORY_LIMIT);
                const decision = await this.ai.route(history, cycle.ids);
                if (this.isSilenced(cycle, bot) || !decision?.some((pick) => pick.bot === bot)) return;
            }
        }

        const posted = await this.speak(cycle, bot);
        // Only a posted reply uses up the cap; cycles in a channel never overlap, so none can slip in meanwhile.
        if (posted && kind === 'spontaneous') this.caps.record(cycle.channel.id, bot.user.id, Date.now());
    }

    /** At most one bot that has not spoken yet reacts to the replies, under its spontaneous cap. */
    private async react(cycle: BotCycle): Promise<void> {
        const { channel, conversation, ids, spoken } = cycle;
        if (this.destroyed || conversation.interrupted) return;

        const history = await this.messageRepository.getRecentMessages(channel.id, ROUTER_HISTORY_LIMIT);
        const decision = (await this.ai.route(history, ids, spoken)) ?? [];
        const reaction = decision.find(
            ({ bot }) => !spoken.includes(bot) && this.caps.canSpeak(channel.id, bot.user.id, Date.now()),
        );
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- a human message may arrive while `route` runs
        if (!reaction || conversation.interrupted) return;

        await sleep(READ_PAUSE_MS);
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- a human message or destroy may happen during the pause
        if (conversation.interrupted || this.destroyed) return;

        const posted = await this.speak(cycle, reaction.bot);
        if (posted) this.caps.record(channel.id, reaction.bot.user.id, Date.now());
    }

    /**
     * Generates, stores and broadcasts one reply, and adds the bot to `cycle.spoken`. The typing indicator stays on
     * until the reply is posted, paced like typing. Returns whether a message was posted.
     */
    private async speak(cycle: BotCycle, bot: AIBot): Promise<boolean> {
        const { channel } = cycle;

        this.presence.startBotTyping(bot.user.id, channel.id);

        const startedAt = Date.now();
        try {
            const history = await this.messageRepository.getRecentMessages(channel.id, AI_HISTORY_LIMIT);
            const content = await this.ai.reply(bot, history);
            if (!content) return false;

            await sleep(typingDelayMs(content.length, Date.now() - startedAt));
            if (this.destroyed) return false;

            const createdAt = new Date();
            const reply = { content, channelId: channel.id, authorId: bot.user.id };
            const { id } = await this.messageRepository.createMessage({ ...reply, createdAt });

            const guildMembers = (await this.userRepository.getGuildUsers(channel.guildId)).map((user) => user.id);
            this.emitter.emitToUsers(guildMembers, SocketEvents.MESSAGE_CREATE, {
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
