import type { Channel, SyncPayload } from '@fidechat/shared';
import { useCallback } from 'react';

import { useSyncQuery } from '@/features/sync/sync-query';

/** Drops the messages: channel UI must not re-render on every message. */
function toChannel({ id, name, description, position, guildId }: Channel) {
    return { id, name, description, position, guildId };
}

const EMPTY: Channel[] = [];

/** The guild's channels, ordered by position. */
export function useGuildChannels(guildId: string): Channel[] {
    const select = useCallback(
        (data: SyncPayload) =>
            data.channels
                .filter((c) => c.guildId === guildId)
                .map(toChannel)
                .sort((a, b) => a.position - b.position),
        [guildId],
    );
    return useSyncQuery(select).data ?? EMPTY;
}

export function useChannel(
    guildId: string,
    channelId: string,
): Channel | undefined {
    const select = useCallback(
        (data: SyncPayload) => {
            const channel = data.channels.find(
                (c) => c.id === channelId && c.guildId === guildId,
            );
            return channel && toChannel(channel);
        },
        [guildId, channelId],
    );
    return useSyncQuery(select).data;
}
