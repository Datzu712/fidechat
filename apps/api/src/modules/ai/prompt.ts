import type { ModelMessage } from 'ai';

import type { AIBot } from './bots.js';

/** `message.content` is a `varchar(2000)`. */
export const MAX_MESSAGE_LENGTH = 2000;

export interface ChannelHistoryEntry {
    authorId: string;
    authorName: string;
    content: string;
}

/**
 * The bot's own messages are its turns; everything else, other bots included, is user input prefixed with the
 * author's name so the model can tell who said what.
 */
export function buildPromptMessages(bot: AIBot, history: ChannelHistoryEntry[]): ModelMessage[] {
    return history.map((entry) =>
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
