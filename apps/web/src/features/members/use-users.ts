import type { AppUser, SyncPayload } from '@fidechat/shared';
import { useCallback, useMemo } from 'react';

import { useSyncQuery } from '@/features/sync/sync-query';

/** Other users never carry their email. */
export type PublicUser = Omit<AppUser, 'email'>;

const selectCurrentUser = (data: SyncPayload) => data.currentUser;

export function useCurrentUser(): AppUser | undefined {
    return useSyncQuery(selectCurrentUser).data;
}

export function useUser(userId: string): PublicUser | undefined {
    const select = useCallback(
        (data: SyncPayload) => data.users.find((u) => u.id === userId),
        [userId],
    );
    return useSyncQuery(select).data;
}

const selectUsers = (data: SyncPayload) => data.users;

/** Every known user by id, for message author lookups. */
export function useUsersById(): Map<string, PublicUser> {
    const users = useSyncQuery(selectUsers).data;
    return useMemo(
        () => new Map((users ?? []).map((user) => [user.id, user])),
        [users],
    );
}
