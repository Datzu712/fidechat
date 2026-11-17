import type { AIBot } from '../../ai/bots.js';
import type { Channel } from '../../channel/channel.repository.js';

/** Silence after the last human message before the bots decide whether to speak. */
export const DEBOUNCE_MS = 600;
/** How many channel messages a bot reads before replying. */
export const AI_HISTORY_LIMIT = 30;
/** Typing speed a bot reply is paced at, so it appears roughly when a person would have finished typing it. */
const TYPING_CHARS_PER_SECOND = 40;
const MAX_TYPING_MS = 3000;
/** Pause before a spontaneous bot answers the replies before it, as if reading them. */
export const READ_PAUSE_MS = 1200;

/** How much longer the typing indicator stays once generation took `generationMs`. */
export function typingDelayMs(length: number, generationMs: number): number {
    return Math.max(0, Math.min((length / TYPING_CHARS_PER_SECOND) * 1000, MAX_TYPING_MS) - generationMs);
}

export async function sleep(ms: number): Promise<void> {
    // oxlint-disable-next-line promise/avoid-new -- a plain setTimeout, so Jest fake timers control it
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ChannelConversation {
    timer?: NodeJS.Timeout;
    /** Human messages no cycle has taken yet. While a cycle runs, any message here means a human interrupted it. */
    pending: Array<{ id: string; content: string }>;
    /** Cycles run one after another, never overlapping. */
    chain: Promise<void>;
}

/** One run over a channel's pending human messages. */
export interface BotCycle {
    channel: Channel;
    conversation: ChannelConversation;
    /** The human messages this cycle answers. */
    ids: ReadonlySet<string>;
    /** Bots named in those messages: they answer even after a human interrupt. */
    named: readonly AIBot[];
    /** Bots that posted in this cycle, in posting order. */
    spoken: AIBot[];
}
