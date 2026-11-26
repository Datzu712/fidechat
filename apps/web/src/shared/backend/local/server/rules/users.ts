import {
    type AppUser,
    type AuthMe,
    type GuildMember,
    type GuildWithMembers,
    SocketEvents,
    type SyncPayload,
} from '@fidechat/shared';
import * as z from 'zod/mini';

import type { UserList } from '@/shared/backend/local/protocol';
import type { LocalState } from '@/shared/backend/local/server/data/state';
import {
    memberIds,
    nameSchema,
    parseOrReject,
    type RuleContext,
    RuleError,
    type RuleOutcome,
    toPublicUser,
} from '@/shared/backend/local/server/rules/helpers';

export const MAX_USERNAME_LENGTH = 32;

const usernameSchema = nameSchema.check(
    z.trim(),
    z.maxLength(MAX_USERNAME_LENGTH, { error: 'Name is too long' }),
);

export function me(state: LocalState, userId: string | null): AuthMe | null {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return null;
    return {
        sub: user.id,
        name: user.username,
        username: user.username,
        email: user.email,
    };
}

export function listUsers(state: LocalState, context: RuleContext): UserList {
    return {
        users: state.users.filter((u) => !u.isBot).map(toPublicUser),
        connectedUsers: context.connectedUsers,
    };
}

export function createUser({
    state,
    username,
    context,
}: {
    state: LocalState;
    username: string;
    context: RuleContext;
}): RuleOutcome {
    const name = parseOrReject(usernameSchema, username);
    const taken = state.users.some(
        (u) => u.username.trim().toLowerCase() === name.toLowerCase(),
    );
    if (taken) throw new RuleError(400, 'That name is taken');

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const user: AppUser = {
        id: context.newId(),
        username: name,
        email: `${slug || 'user'}@demo.local`,
        isBot: false,
        avatarUrl: null,
    };
    const memberMetadata: GuildMember = {
        guildId: state.defaultGuildId,
        userId: user.id,
    };
    const next: LocalState = {
        ...state,
        users: [...state.users, user],
        members: [...state.members, memberMetadata],
    };

    return {
        state: next,
        events: [
            {
                to: memberIds(next, state.defaultGuildId),
                event: SocketEvents.MEMBER_ADD,
                // Every guild member receives this, so it must not carry the email.
                payload: { user: toPublicUser(user), memberMetadata },
            },
        ],
        result: user,
    };
}

export function sync({
    state,
    userId,
    context,
}: {
    state: LocalState;
    userId: string;
    context: RuleContext;
}): SyncPayload {
    const currentUser = state.users.find((u) => u.id === userId);
    if (!currentUser) throw new RuleError(400, 'No sync data found for user');

    const guildIds = new Set(
        state.members.filter((m) => m.userId === userId).map((m) => m.guildId),
    );
    const membersByGuild = groupBy(state.members, (m) => m.guildId);
    const guilds: GuildWithMembers[] = state.guilds
        .filter((guild) => guildIds.has(guild.id))
        .map((guild) => ({
            ...guild,
            members: (membersByGuild.get(guild.id) ?? []).map((m) => ({
                userId: m.userId,
            })),
        }));
    const messagesByChannel = groupBy(state.messages, (m) => m.channelId);
    const channels = state.channels
        .filter((channel) => guildIds.has(channel.guildId))
        .toSorted((a, b) => a.position - b.position)
        .map((channel) => ({
            ...channel,
            messages: (messagesByChannel.get(channel.id) ?? []).toSorted(
                (a, b) => a.createdAt.localeCompare(b.createdAt),
            ),
        }));
    const otherMemberIds = new Set(
        state.members
            .filter((m) => guildIds.has(m.guildId) && m.userId !== userId)
            .map((m) => m.userId),
    );
    const users = state.users
        .filter((u) => otherMemberIds.has(u.id))
        .map(toPublicUser);

    return {
        guilds,
        channels,
        currentUser,
        users,
        connectedUsers: context.connectedUsers,
    };
}

/** `Map.groupBy` is newer than the build's browser targets. */
function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const id = key(item);
        const group = groups.get(id);
        if (group) group.push(item);
        else groups.set(id, [item]);
    }
    return groups;
}
