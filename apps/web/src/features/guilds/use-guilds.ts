import type { GuildWithMembers, SyncPayload } from '@fidechat/shared';
import { useCallback } from 'react';

import { useSyncQuery } from '@/features/sync/sync-query';

const selectGuilds = (data: SyncPayload) => data.guilds;

export function useGuilds(): GuildWithMembers[] | undefined {
    return useSyncQuery(selectGuilds).data;
}

export function useGuild(guildId: string): GuildWithMembers | undefined {
    const select = useCallback(
        (data: SyncPayload) => data.guilds.find((g) => g.id === guildId),
        [guildId],
    );
    return useSyncQuery(select).data;
}
