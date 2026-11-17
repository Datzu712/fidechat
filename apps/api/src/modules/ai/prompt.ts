import type { ModelMessage } from 'ai';

import type { AIBot } from './bots.js';

/** `message.content` is a `varchar(2000)`. */
export const MAX_MESSAGE_LENGTH = 2000;

export interface ChannelHistoryEntry {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
}

/**
 * The bot's own messages are its turns; everything else, other bots included, is user input prefixed with the
 * author's name so the model can tell who said what. Anthropic requires the first turn to be the user's and rejects
 * a final assistant turn (prefill), so the bot's own messages at either edge of the window are dropped.
 */
export function buildPromptMessages(bot: AIBot, history: ChannelHistoryEntry[]): ModelMessage[] {
    const first = history.findIndex((entry) => entry.authorId !== bot.user.id);
    const last = history.findLastIndex((entry) => entry.authorId !== bot.user.id);
    if (first === -1) return [];

    return history
        .slice(first, last + 1)
        .map((entry) =>
            entry.authorId === bot.user.id
                ? { role: 'assistant', content: entry.content }
                : { role: 'user', content: `${entry.authorName}: ${entry.content}` },
        );
}

/** Drops the `"<bot name>: "` prefix the model may copy from the history format. */
export function cleanReply(bot: AIBot, text: string): string {
    const ownPrefix = `${bot.user.username}:`;
    let reply = text.trim();
    if (reply.toLowerCase().startsWith(ownPrefix.toLowerCase())) {
        reply = reply.slice(ownPrefix.length).trim();
    }
    return reply.slice(0, MAX_MESSAGE_LENGTH);
}

/** Cuts a reply that hit the token limit back to its last finished sentence; empty when none finished. */
export function trimToLastSentence(text: string): string {
    return /^[\s\S]*[.!?…](?=\s|$)/.exec(text)?.[0] ?? '';
}

const spanishList = new Intl.ListFormat('es', { type: 'conjunction' });

/** Appended to the persona when a bot reacts to other bots' replies, so it comments on them instead of answering again. */
export function reactionInstructions(reactingTo: readonly AIBot[]): string {
    const names = spanishList.format(reactingTo.map((bot) => bot.user.username));
    return `

Ahora mismo no respondes a la persona: reaccionas a lo que acaba de decir ${names}, como lo haría un amigo con confianza. Lo normal es picarlo, burlarte con cariño de su respuesta o llevarle la contraria con tu propio gusto; no lo felicites ni repitas lo que dijo. Habla con él directamente, sin volver a contestar la pregunta. Una frase, dos como mucho.`;
}
