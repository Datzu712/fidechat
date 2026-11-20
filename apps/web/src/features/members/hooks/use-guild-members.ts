import type { PublicUser, SyncPayload } from '@fidechat/shared';
import { useCallback } from 'react';

import { getStatusDisplay } from '@/features/presence/lib/user-status';
import { useSyncQuery } from '@/features/sync/hooks/sync-query';

interface GuildMemberGroups {
    owner?: PublicUser;
    bots: PublicUser[];
    /** Human members other than the owner, online first. */
    members: PublicUser[];
}

export function useGuildMembers(
    guildId: string,
): GuildMemberGroups | undefined {
    const select = useCallback(
        (data: SyncPayload): GuildMemberGroups | undefined => {
            const guild = data.guilds.find((g) => g.id === guildId);
            if (!guild) return undefined;

            const statusOf = (userId: string) =>
                data.connectedUsers.find((u) => u.userId === userId)?.status;
            const memberIds = new Set(guild.members.map((m) => m.userId));

            return {
                owner: data.users.find((u) => u.id === guild.ownerId),
                // The bots answer in every guild.
                bots: data.users.filter((u) => u.isBot),
                members: data.users
                    .filter(
                        (u) =>
                            memberIds.has(u.id) &&
                            u.id !== guild.ownerId &&
                            !u.isBot,
                    )
                    .sort(
                        (a, b) =>
                            getStatusDisplay(statusOf(a.id)).priority -
                            getStatusDisplay(statusOf(b.id)).priority,
                    ),
            };
        },
        [guildId],
    );
    return useSyncQuery(select).data;
}
