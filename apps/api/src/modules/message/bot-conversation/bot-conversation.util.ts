/** Silence after the last human message before the bots decide whether to speak. */
export const DEBOUNCE_MS = 600;
/** How many channel messages the router reads. */
export const ROUTER_HISTORY_LIMIT = 20;
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
    pending: Array<{ id: string; content: string }>;
    /** Set by every human message, so a running cycle skips the remaining turns of bots nobody named. */
    interrupted: boolean;
    /** Cycles run one after another, never overlapping. */
    chain: Promise<void>;
}
