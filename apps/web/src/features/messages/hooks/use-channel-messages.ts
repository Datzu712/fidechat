import type { Message, SyncPayload } from '@fidechat/shared';
import { useCallback } from 'react';

import { useSyncQuery } from '@/features/sync/hooks/sync-query';

const EMPTY: Message[] = [];

/** The channel's messages, oldest first. */
export function useChannelMessages(channelId: string): Message[] {
    const select = useCallback(
        (data: SyncPayload) =>
            (data.channels.find((c) => c.id === channelId)?.messages ?? EMPTY)
                .slice()
                .sort(
                    (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime(),
                ),
        [channelId],
    );
    return useSyncQuery(select).data ?? EMPTY;
}
