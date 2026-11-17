import { SocketEvents } from '@fidechat/shared';
import type { ServerToClientEvents, SyncPayload } from '@fidechat/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { syncQueryKey } from '@/features/sync/sync-query';
import {
    addChannel,
    addGuild,
    addMember,
    addMessage,
    removeMessage,
    setConnectedUsers,
    updateMessage,
} from '@/features/sync/sync-updaters';
import { useSocket } from '@/shared/socket/use-socket';
import { useSocketEvents } from '@/shared/socket/use-socket-events';

/** Keeps the `['sync']` query up to date with the socket events. */
export function useRealtimeSync(): void {
    const queryClient = useQueryClient();
    const { socket, connected } = useSocket();

    const handlers = useMemo<Partial<ServerToClientEvents>>(() => {
        const patch =
            <P>(updater: (data: SyncPayload, payload: P) => SyncPayload) =>
            (payload: P) =>
                queryClient.setQueryData<SyncPayload>(syncQueryKey, (data) =>
                    data ? updater(data, payload) : data,
                );

        return {
            [SocketEvents.GUILD_CREATE]: patch(addGuild),
            [SocketEvents.CHANNEL_CREATE]: patch(addChannel),
            [SocketEvents.MEMBER_ADD]: patch(addMember),
            [SocketEvents.MESSAGE_CREATE]: patch(addMessage),
            [SocketEvents.MESSAGE_UPDATE]: patch(updateMessage),
            [SocketEvents.MESSAGE_DELETE]: patch(removeMessage),
            [SocketEvents.USER_STATUS_UPDATE]: patch(setConnectedUsers),
            [SocketEvents.FORCE_SYNC]: () =>
                void queryClient.invalidateQueries({ queryKey: syncQueryKey }),
        };
    }, [queryClient]);

    useSocketEvents(socket, connected, handlers);

    // The first connection enables the query; later ones (reconnects) may
    // have missed events, so they refetch it.
    const hasConnected = useRef(false);
    useEffect(() => {
        if (!connected) return;
        if (hasConnected.current) {
            void queryClient.invalidateQueries({ queryKey: syncQueryKey });
        }
        hasConnected.current = true;
    }, [connected, queryClient]);
}
