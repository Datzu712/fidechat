import {
    MAX_MESSAGE_LENGTH,
    type Message,
    SocketEvents,
} from '@fidechat/shared';
import * as z from 'zod/mini';

import type { LocalState } from '@/shared/backend/local/server/data/state';
import {
    assertMember,
    memberIds,
    parseOrReject,
    type Request,
    type RuleContext,
    RuleError,
    type RuleOutcome,
} from '@/shared/backend/local/server/rules/helpers';

export function createMessage({
    state,
    authorId,
    request,
    context,
}: {
    state: LocalState;
    authorId: string;
    request: Request<'createMessage'>;
    context: RuleContext;
}): RuleOutcome {
    const content = parseOrReject(contentSchema, request.payload.content);
    const channel = state.channels.find((c) => c.id === request.channelId);
    // A channel addressed through another guild does not exist there.
    if (channel?.guildId !== request.guildId) {
        throw new RuleError(404, 'Channel not found');
    }
    assertMember({ state, guildId: request.guildId, userId: authorId });
    return appendMessage({
        state,
        authorId,
        channelId: channel.id,
        content,
        context,
    });
}

export function updateMessage({
    state,
    editorId,
    request,
}: {
    state: LocalState;
    editorId: string;
    request: Request<'updateMessage'>;
}): RuleOutcome {
    const content = parseOrReject(contentSchema, request.payload.content);
    const { id } = ownMessage({ state, userId: editorId, request });
    return {
        state: {
            ...state,
            messages: state.messages.map((m) =>
                m.id === id ? { ...m, content } : m,
            ),
        },
        events: [
            {
                to: memberIds(state, request.guildId),
                event: SocketEvents.MESSAGE_UPDATE,
                payload: { id, content } satisfies Pick<
                    Message,
                    'id' | 'content'
                >,
            },
        ],
        result: { success: true },
    };
}

export function deleteMessage({
    state,
    userId,
    request,
}: {
    state: LocalState;
    userId: string;
    request: Request<'deleteMessage'>;
}): RuleOutcome {
    const { id, channelId } = ownMessage({ state, userId, request });
    return {
        state: {
            ...state,
            messages: state.messages.filter((m) => m.id !== id),
        },
        events: [
            {
                to: memberIds(state, request.guildId),
                event: SocketEvents.MESSAGE_DELETE,
                payload: { id, channelId } satisfies Pick<
                    Message,
                    'id' | 'channelId'
                >,
            },
        ],
        result: { success: true },
    };
}

/** A message with no membership check; the bots use it too. */
export function appendMessage({
    state,
    authorId,
    channelId,
    content,
    context,
}: {
    state: LocalState;
    authorId: string;
    channelId: string;
    content: string;
    context: RuleContext;
}): RuleOutcome {
    const channel = state.channels.find((c) => c.id === channelId);
    if (!channel) throw new RuleError(404, 'Channel not found');

    const message: Message = {
        id: context.newId(),
        content,
        authorId,
        channelId,
        createdAt: context.now().toISOString(),
    };

    return {
        state: { ...state, messages: [...state.messages, message] },
        events: [
            {
                to: memberIds(state, channel.guildId),
                event: SocketEvents.MESSAGE_CREATE,
                payload: message,
            },
        ],
        result: { id: message.id },
    };
}

const contentError = `Message content must be a string of at most ${MAX_MESSAGE_LENGTH} characters`;
const contentSchema = z
    .string({ error: contentError })
    .check(z.maxLength(MAX_MESSAGE_LENGTH, { error: contentError }));

/**
 * The message the route points to, if the user wrote it. A message outside the route's guild or
 * channel is not found; someone else's is forbidden.
 */
function ownMessage({
    state,
    userId,
    request,
}: {
    state: LocalState;
    userId: string;
    request: Request<'updateMessage' | 'deleteMessage'>;
}): Message {
    const message = state.messages.find((m) => m.id === request.messageId);
    if (message?.channelId !== request.channelId) {
        throw new RuleError(404, 'Message not found');
    }

    const channel = state.channels.find((c) => c.id === request.channelId);
    if (channel?.guildId !== request.guildId) {
        throw new RuleError(404, 'Message not found');
    }

    if (message.authorId !== userId) {
        throw new RuleError(403, 'Only the author can change this message');
    }

    return message;
}
