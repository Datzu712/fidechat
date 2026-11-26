import {
    type BotResponder,
    createBotResponder,
} from '@/shared/backend/local/server/bots/bots';
import type { ServerCore } from '@/shared/backend/local/server/core';
import { appendMessage } from '@/shared/backend/local/server/rules/messages';
import type { Tabs } from '@/shared/backend/local/server/tabs';

// The bots' responder, reading the server's state and posting through its
// queue, so generating never blocks requests.

export function connectBots({
    core,
    tabs,
}: {
    core: ServerCore;
    tabs: Tabs;
}): BotResponder {
    return createBotResponder({
        generate: core.deps.generate,
        history(channelId, limit) {
            const { users, messages } = core.state;
            const names = new Map(users.map((u) => [u.id, u.username]));
            return messages
                .filter((m) => m.channelId === channelId)
                .slice(-limit)
                .map((m) => ({
                    authorId: m.authorId,
                    authorName: names.get(m.authorId) ?? '',
                    content: m.content,
                }));
        },
        usernames: () => core.state.users.map((u) => u.username),
        post({ botId, channelId, content }) {
            return core.enqueue(async () => {
                const outcome = appendMessage({
                    state: core.state,
                    authorId: botId,
                    channelId,
                    content,
                    context: core.context(),
                });
                await core.commit(outcome);
                core.postEvents(outcome.events);
            });
        },
        setTyping({ botId, channelId, typing }) {
            tabs.broadcastPresence(
                core.presence.setTyping({ userId: botId, channelId, typing }),
            );
        },
        settings: () => core.state.botSettings,
    });
}
