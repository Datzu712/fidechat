import type { LocalRequest } from '@/shared/backend/local/protocol';
import type { LocalState } from '@/shared/backend/local/server/data/state';
import { createChannel } from '@/shared/backend/local/server/rules/channels';
import {
    createGuild,
    getPublicGuilds,
} from '@/shared/backend/local/server/rules/guilds';
import {
    type RuleContext,
    type RuleOutcome,
    signedIn,
    unchanged,
} from '@/shared/backend/local/server/rules/helpers';
import {
    createMessage,
    deleteMessage,
    updateMessage,
} from '@/shared/backend/local/server/rules/messages';
import { updateBotSettings } from '@/shared/backend/local/server/rules/settings';
import {
    createUser,
    listUsers,
    me,
    sync,
} from '@/shared/backend/local/server/rules/users';

/** Never mutates `state`. Handles every op except `reset`, which the server owns. */
export function applyRequest({
    state,
    userId,
    request,
    context,
}: {
    state: LocalState;
    userId: string | null;
    request: LocalRequest;
    context: RuleContext;
}): RuleOutcome {
    switch (request.op) {
        case 'me':
            return unchanged(state, me(state, userId));
        case 'listUsers':
            return unchanged(state, listUsers(state, context));
        case 'createUser':
            return createUser({ state, username: request.username, context });
        case 'reset':
            throw new Error('The server handles reset');
        case 'sync':
            return unchanged(
                state,
                sync({ state, userId: signedIn(userId), context }),
            );
        case 'getPublicGuilds':
            signedIn(userId);
            return unchanged(state, getPublicGuilds(state));
        case 'getBotSettings':
            signedIn(userId);
            return unchanged(state, state.botSettings);
        case 'updateBotSettings':
            signedIn(userId);
            return updateBotSettings({ state, request });
        case 'createGuild':
            return createGuild({
                state,
                userId: signedIn(userId),
                request,
                context,
            });
        case 'createChannel':
            return createChannel({
                state,
                userId: signedIn(userId),
                request,
                context,
            });
        case 'createMessage':
            return createMessage({
                state,
                authorId: signedIn(userId),
                request,
                context,
            });
        case 'updateMessage':
            return updateMessage({
                state,
                editorId: signedIn(userId),
                request,
            });
        case 'deleteMessage':
            return deleteMessage({
                state,
                userId: signedIn(userId),
                request,
            });
    }
}
