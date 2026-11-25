import { BOT_DEFINITIONS, type BotDefinition } from '@fidechat/shared';

import type { ChatMessage } from '@/shared/backend/local/model/model-protocol';

/** Appended to the persona: a small model rambles without it. */
export const SHORT_STYLE =
    ' Estás en un chat de grupo con amigos. Responde en español con 1 o 2 frases cortas y casuales, solo con tu mensaje.';

export interface HistoryEntry {
    authorId: string;
    authorName: string;
    content: string;
}

/**
 * Mirrors the api prompt: the bot's own messages are its turns, everything
 * else is user input prefixed with the author's name. Leading assistant turns
 * are dropped so the conversation starts with a user turn.
 */
export function buildBotMessages({
    bot,
    history,
    historyLimit,
}: {
    bot: BotDefinition;
    history: HistoryEntry[];
    /** How many of the last messages the bot reads. */
    historyLimit: number;
}): ChatMessage[] {
    const window = history.slice(-historyLimit);
    const first = window.findIndex((entry) => entry.authorId !== bot.user.id);
    const turns: ChatMessage[] = (first === -1 ? [] : window.slice(first)).map(
        (entry) =>
            entry.authorId === bot.user.id
                ? { role: 'assistant', content: entry.content }
                : {
                      role: 'user',
                      content: `${entry.authorName}: ${entry.content}`,
                  },
    );
    return [{ role: 'system', content: bot.persona + SHORT_STYLE }, ...turns];
}

/** A leading `name:` the model may copy from the history format. */
const NAME_PREFIX = /^([^:\n]+):\s*/;

/** The whole name is a known username or a bot's name, not a clause. */
function isSpeakerName(name: string, usernames: string[]): boolean {
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    return (
        usernames.some((username) => username.toLowerCase() === lower) ||
        BOT_DEFINITIONS.some(
            (bot) => bot.trigger.exec(trimmed)?.[0] === trimmed,
        )
    );
}

/** Empty string when nothing usable is left. */
export function cleanBotReply({
    text,
    truncated,
    usernames,
}: {
    text: string;
    truncated: boolean;
    usernames: string[];
}): string {
    let reply = text.trim();
    let prefix = NAME_PREFIX.exec(reply);
    while (prefix && isSpeakerName(prefix[1], usernames)) {
        reply = reply.slice(prefix[0].length).trim();
        prefix = NAME_PREFIX.exec(reply);
    }
    if (truncated) {
        // Cut back to the last finished sentence, like the api.
        reply = /^[\s\S]*[.!?…](?=\s|$)/.exec(reply)?.[0] ?? '';
    }
    return reply;
}
