import type { SyncPayload } from '@fidechat/shared';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { useSocket } from '@/shared/socket/use-socket';

/**
 * The whole client state lives in one query: `GET /users/@me/sync` fills it
 * and socket events patch it (see `use-realtime-sync.ts`).
 */
export const syncQueryKey = ['sync'] as const;

async function fetchSync(): Promise<SyncPayload> {
    const { data } = await apiClient.get<SyncPayload>('/users/@me/sync');
    // The current user is not always in `users`; message authors need it there.
    if (!data.users.some((user) => user.id === data.currentUser.id)) {
        data.users.push(data.currentUser);
    }
    return data;
}

/**
 * Reads a slice of the synced state. `select` should be stable (module level
 * or `useCallback`); the component re-renders only when its slice changes.
 */
export function useSyncQuery<T>(select: (data: SyncPayload) => T) {
    const { connected } = useSocket();

    return useQuery({
        queryKey: syncQueryKey,
        queryFn: fetchSync,
        select,
        // The socket keeps it fresh; it is refetched on reconnect.
        enabled: connected,
        staleTime: Infinity,
    });
}

const isLoadedSelect = () => true;

export interface SyncStatus {
    isLoaded: boolean;
    /** The first load failed (after the query's retries). */
    isError: boolean;
    retry: () => void;
}

export function useSyncStatus(): SyncStatus {
    const { data, isError, refetch } = useSyncQuery(isLoadedSelect);
    return {
        isLoaded: data === true,
        isError,
        retry: () => void refetch(),
    };
}
