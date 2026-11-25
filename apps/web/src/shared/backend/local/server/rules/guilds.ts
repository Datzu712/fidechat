import {
    type Guild,
    type GuildWithMembers,
    SocketEvents,
} from '@fidechat/shared';
import * as z from 'zod/mini';

import type { LocalState } from '@/shared/backend/local/server/data/state';
import {
    nameSchema,
    parseOrReject,
    type Request,
    type RuleContext,
    type RuleOutcome,
} from '@/shared/backend/local/server/rules/helpers';

const iconUrlError = 'Icon URL must be a valid URL';
const isPublicError = 'isPublic must be a boolean';

// Like the api's `@IsOptional`, null counts as absent.
const guildSchema = z.object({
    name: nameSchema,
    iconUrl: z.nullish(
        z
            .string({ error: iconUrlError })
            .check(z.refine(isUrl, { error: iconUrlError })),
    ),
    isPublic: z.nullish(z.boolean({ error: isPublicError })),
});

export function getPublicGuilds(state: LocalState): Guild[] {
    return state.guilds.filter((guild) => guild.isPublic);
}

export function createGuild({
    state,
    userId,
    request,
    context,
}: {
    state: LocalState;
    userId: string;
    request: Request<'createGuild'>;
    context: RuleContext;
}): RuleOutcome {
    const { name, iconUrl, isPublic } = parseOrReject(
        guildSchema,
        request.payload,
    );

    const guild: Guild = {
        id: context.newId(),
        name,
        iconUrl: iconUrl ?? null,
        isPublic: isPublic ?? false,
        ownerId: userId,
        description: null,
    };

    return {
        state: {
            ...state,
            guilds: [...state.guilds, guild],
            members: [...state.members, { guildId: guild.id, userId }],
        },
        events: [
            {
                to: [userId],
                event: SocketEvents.GUILD_CREATE,
                payload: {
                    ...guild,
                    members: [{ userId }],
                } satisfies GuildWithMembers,
            },
        ],
        result: { id: guild.id, success: true },
    };
}

/**
 * Close to the api's `@IsUrl()`: http, https or ftp, the protocol optional, and a host with a
 * top-level domain.
 */
function isUrl(value: string): boolean {
    const href = value.includes('://') ? value : `http://${value}`;
    if (!URL.canParse(href)) return false;
    const { protocol, hostname } = new URL(href);
    return (
        ['http:', 'https:', 'ftp:'].includes(protocol) &&
        /\.[a-z]{2,}$/i.test(hostname)
    );
}
