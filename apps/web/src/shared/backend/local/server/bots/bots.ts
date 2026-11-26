import {
    BOT_DEFINITIONS,
    type BotDefinition,
    MAX_MESSAGE_LENGTH,
} from '@fidechat/shared';

import type {
    GenerateInput,
    Generated,
} from '@/shared/backend/local/model/model-protocol';
import type { BotSettings } from '@/shared/backend/local/protocol';
import {
    buildBotMessages,
    cleanBotReply,
    type HistoryEntry,
} from '@/shared/backend/local/server/bots/bot-prompt';

export interface BotResponderDeps {
    /** Resolves null when no model is ready. */
    generate(input: GenerateInput): Promise<Generated | null>;
    /** The channel's last `limit` messages, oldest first. */
    history(channelId: string, limit: number): HistoryEntry[];
    usernames(): string[];
    post(input: {
        botId: string;
        channelId: string;
        content: string;
    }): Promise<void>;
    setTyping(input: {
        botId: string;
        channelId: string;
        typing: boolean;
    }): void;
    /** The current settings, read at each bot's turn. */
    settings(): BotSettings;
}

export interface BotResponder {
    onHumanMessage(input: { channelId: string; content: string }): void;
    /** Resolves when everything queued so far has finished; for tests. */
    idle(): Promise<void>;
}

/**
 * After a human message, the enabled bots it names answer one at a time, in
 * definition order, each reading the history and the settings at its turn.
 * One queue serves the whole responder.
 */
export function createBotResponder(deps: BotResponderDeps): BotResponder {
    let queue = Promise.resolve();

    /** Never rejects, so the queue keeps going. */
    const answer = async (bot: BotDefinition, channelId: string) => {
        const botId = bot.user.id;
        const settings = deps.settings();
        if (settings.disabledBotIds.includes(botId)) return;
        try {
            deps.setTyping({ botId, channelId, typing: true });
            const generated = await deps.generate({
                messages: buildBotMessages({
                    bot,
                    history: deps.history(channelId, settings.historyLimit),
                    historyLimit: settings.historyLimit,
                }),
                temperature: settings.temperature,
                maxNewTokens: settings.maxNewTokens,
            });
            if (!generated) return;

            const content = cleanBotReply({
                ...generated,
                usernames: deps.usernames(),
            }).slice(0, MAX_MESSAGE_LENGTH);
            if (content) await deps.post({ botId, channelId, content });
        } catch (error) {
            console.error(
                new Error(`Bot ${bot.user.username} could not answer`, {
                    cause: error,
                }),
            );
        } finally {
            deps.setTyping({ botId, channelId, typing: false });
        }
    };

    return {
        onHumanMessage({ channelId, content }) {
            for (const bot of BOT_DEFINITIONS) {
                if (!bot.trigger.test(content)) continue;
                queue = queue.then(() => answer(bot, channelId));
            }
        },
        idle: () => queue,
    };
}
