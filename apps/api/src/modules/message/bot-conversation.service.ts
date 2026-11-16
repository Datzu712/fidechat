import { SocketEvents } from '@fidechat/shared';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { AIService } from '../ai/ai.service.js';
import { type AIBot, detectNamedBots } from '../ai/bots.js';
import { type PlannedSpeaker, planSpeakers } from '../ai/router.js';
import { SpontaneousCaps } from '../ai/spontaneous-caps.js';
import type { Channel } from '../channel/channel.repository.js';
import { PresenceService } from '../gateway/presence.service.js';
import { SocketEmitter } from '../gateway/socket-emitter.js';
import { UserRepository } from '../user/user.repository.js';
import { MessageRepository } from './message.repository.js';

/** Silence after the last human message before the bots decide whether to speak. */
const DEBOUNCE_MS = 1500;
/** How many channel messages the router reads. */
const ROUTER_HISTORY_LIMIT = 20;
/** How many channel messages a bot reads before replying. */
const AI_HISTORY_LIMIT = 30;
/** Typing speed a bot reply is paced at, so it appears roughly when a person would have finished typing it. */
const TYPING_CHARS_PER_SECOND = 27;
const MAX_TYPING_MS = 5000;
/** Pause before a bot answers another bot's reply, as if reading it. */
const READ_PAUSE_MS = 1200;

/** How much longer the typing indicator stays once generation took `generationMs`. */
export function typingDelayMs(length: number, generationMs: number): number {
    return Math.max(0, Math.min((length / TYPING_CHARS_PER_SECOND) * 1000, MAX_TYPING_MS) - generationMs);
}

async function sleep(ms: number): Promise<void> {
    // oxlint-disable-next-line promise/avoid-new -- a plain setTimeout, so Jest fake timers control it
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ChannelConversation {
    timer?: NodeJS.Timeout;
    pending: Array<{ id: string; content: string }>;
    /** Set by every human message, so a running cycle skips the remaining turns of bots nobody named. */
    interrupted: boolean;
    /** Cycles run one after another, never overlapping. */
    chain: Promise<void>;
}

/**
 * Decides which bots join a channel conversation. Human messages are debounced; then the router (or, without it,
 * the bots named in the new messages) picks the speakers, who reply in turns, and one other bot may react.
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

    /** Only human messages reach this, so named-bot detection never runs over bot replies. */
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

    onModuleDestroy(): void {
        this.destroyed = true;
        for (const conversation of this.conversations.values()) {
            clearTimeout(conversation.timer);
        }
    }

    private async runCycle(channel: Channel, conversation: ChannelConversation): Promise<void> {
        // A newer message's timer will queue its own cycle, and that one takes the pending messages after their silence.
        if (this.destroyed || conversation.timer !== undefined || conversation.pending.length === 0) return;

        const pending = conversation.pending;
        conversation.pending = [];
        conversation.interrupted = false;

        try {
            const ids = new Set(pending.map((message) => message.id));
            const named = [...new Set(pending.flatMap((message) => detectNamedBots(message.content)))];
            const history = await this.messageRepository.getRecentMessages(channel.id, ROUTER_HISTORY_LIMIT);

            const decision = this.ai.routerEnabled ? await this.ai.route(history, ids) : null;
            const speakers = planSpeakers(decision, named, (bot) =>
                this.caps.canSpeak(channel.id, bot.user.id, Date.now()),
            );

            const spoken = await this.takeTurns(channel, conversation, ids, speakers, named);
            if (decision !== null && spoken.length > 0) {
                const reactor = await this.react(channel, conversation, ids, spoken);
                if (reactor) spoken.push(reactor);
            }

            this.logCycle(channel, decision, named, spoken);
        } catch (error) {
            this.logger.error(new Error(`Bot conversation cycle failed in channel ${channel.id}`, { cause: error }));
        }
    }

    /**
     * The planned speakers reply one after another. A human interrupt skips the remaining bots nobody named, but named
     * bots still answer. Returns who posted a reply.
     */
    private async takeTurns(
        channel: Channel,
        conversation: ChannelConversation,
        ids: ReadonlySet<string>,
        speakers: PlannedSpeaker[],
        named: readonly AIBot[],
    ): Promise<AIBot[]> {
        const spoken: AIBot[] = [];
        // Destroy stops every remaining turn; a human interrupt only the turns of bots nobody named.
        const silenced = (bot: AIBot) => this.destroyed || (conversation.interrupted && !named.includes(bot));
        for (const [index, { bot, kind }] of speakers.entries()) {
            if (silenced(bot)) continue;
            if (index > 0) {
                await sleep(READ_PAUSE_MS);
                if (silenced(bot)) continue;
            }

            if (kind === 'spontaneous') {
                if (index > 0 && !(await this.stillPicked(channel, conversation, ids, bot))) continue;
                this.caps.record(channel.id, bot.user.id, Date.now());
            }
            if (await this.speak(channel, bot)) spoken.push(bot);
        }
        return spoken;
    }

    /** At most one bot that has not spoken yet reacts to the replies, under its spontaneous cap. */
    private async react(
        channel: Channel,
        conversation: ChannelConversation,
        ids: ReadonlySet<string>,
        spoken: AIBot[],
    ): Promise<AIBot | null> {
        if (this.destroyed || conversation.interrupted) return null;

        const history = await this.messageRepository.getRecentMessages(channel.id, ROUTER_HISTORY_LIMIT);
        const decision = (await this.ai.route(history, ids, spoken)) ?? [];
        const reaction = decision.find(
            ({ bot }) => !spoken.includes(bot) && this.caps.canSpeak(channel.id, bot.user.id, Date.now()),
        );
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- a human message may arrive while `route` runs
        if (!reaction || conversation.interrupted) return null;

        await sleep(READ_PAUSE_MS);
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- a human message or destroy may happen during the pause
        if (conversation.interrupted || this.destroyed) return null;

        this.caps.record(channel.id, reaction.bot.user.id, Date.now());
        return (await this.speak(channel, reaction.bot)) ? reaction.bot : null;
    }

    private logCycle(channel: Channel, decision: PlannedSpeaker[] | null, named: AIBot[], spoken: AIBot[]): void {
        const names = (bots: AIBot[]) => bots.map((bot) => bot.user.username).join(', ') || 'none';
        const picks = decision?.map(({ bot, kind }) => `${bot.user.username} (${kind})`).join(', ') || 'none';
        const considered = [...new Set([...(decision ?? []).map(({ bot }) => bot), ...named])];
        const dropped = considered.filter((bot) => !spoken.includes(bot));
        this.logger.debug(
            `Channel ${channel.id}: router ${decision === null ? 'unavailable' : `picked ${picks}`}, ` +
                `dropped ${names(dropped)}, spoke ${names(spoken)}`,
        );
    }

    /** Re-asks the router with the latest history whether `bot` should still speak; never after a human interrupts. */
    private async stillPicked(
        channel: Channel,
        conversation: ChannelConversation,
        ids: ReadonlySet<string>,
        bot: AIBot,
    ): Promise<boolean> {
        const history = await this.messageRepository.getRecentMessages(channel.id, ROUTER_HISTORY_LIMIT);
        const decision = await this.ai.route(history, ids);
        return !conversation.interrupted && (decision?.some((pick) => pick.bot === bot) ?? false);
    }

    /**
     * Generates, stores and broadcasts one reply. The typing indicator stays on until the reply is posted, paced like
     * typing. Returns whether a message was posted.
     */
    private async speak(channel: Channel, bot: AIBot): Promise<boolean> {
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
            return true;
        } catch (error) {
            this.logger.error(new Error(`Error generating the ${bot.user.username} reply`, { cause: error }));
            return false;
        } finally {
            this.presence.stopBotTyping(bot.user.id, channel.id);
        }
    }
}
