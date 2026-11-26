import { type Channel, SocketEvents } from '@fidechat/shared';
import * as z from 'zod/mini';

import type { LocalState } from '@/shared/backend/local/server/data/state';
import {
    memberIds,
    nameSchema,
    parseOrReject,
    type Request,
    type RuleContext,
    RuleError,
    type RuleOutcome,
} from '@/shared/backend/local/server/rules/helpers';

// Like the api's `@IsOptional`, null counts as absent. `z.number()` rejects NaN
// and Infinity.
const channelSchema = z.object({
    name: nameSchema,
    description: z.nullish(z.string({ error: 'Description must be a string' })),
    position: z.nullish(z.number({ error: 'Position must be a number' })),
});

export function createChannel({
    state,
    userId,
    request,
    context,
}: {
    state: LocalState;
    userId: string;
    request: Request<'createChannel'>;
    context: RuleContext;
}): RuleOutcome {
    const { guildId } = request;
    const { name, description, position } = parseOrReject(
        channelSchema,
        request.payload,
    );
    const guild = state.guilds.find((g) => g.id === guildId);
    if (!guild) throw new RuleError(404, 'Guild not found');
    if (guild.ownerId !== userId) {
        throw new RuleError(403, 'Only the guild owner can create channels');
    }

    const channel: Channel = {
        id: context.newId(),
        name,
        description: description ?? null,
        position: position ?? 0,
        guildId,
    };

    return {
        state: { ...state, channels: [...state.channels, channel] },
        events: [
            {
                to: memberIds(state, guildId),
                event: SocketEvents.CHANNEL_CREATE,
                payload: channel,
            },
        ],
        result: { id: channel.id, success: true },
    };
}
