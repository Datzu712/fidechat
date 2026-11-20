import type { AppUser, PublicUser, SyncPayload } from '@fidechat/shared';
import { useMemo } from 'react';

import { useSyncQuery } from '@/features/sync/hooks/sync-query';

const selectCurrentUser = (data: SyncPayload) => data.currentUser;

export function useCurrentUser(): AppUser | undefined {
    return useSyncQuery(selectCurrentUser).data;
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
