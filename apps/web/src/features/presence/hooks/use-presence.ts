import type { SyncPayload, UserStatus } from '@fidechat/shared';
import { useCallback } from 'react';

import type { PublicUser } from '@/features/members/hooks/use-users';
import { useSyncQuery } from '@/features/sync/hooks/sync-query';

export function useUserStatus(userId: string): UserStatus | undefined {
    const select = useCallback(
        (data: SyncPayload) =>
            data.connectedUsers.find((u) => u.userId === userId)?.status,
        [userId],
    );
    return useSyncQuery(select).data;
}

const EMPTY: PublicUser[] = [];

/** Users typing in the channel right now. */
export function useTypingUsers(channelId: string): PublicUser[] {
    const select = useCallback(
        (data: SyncPayload) =>
            data.connectedUsers
                .filter((u) => u.isTyping && u.typingInChannel === channelId)
                .map((u) => data.users.find((user) => user.id === u.userId))
                .filter((user) => user !== undefined),
        [channelId],
    );
    return useSyncQuery(select).data ?? EMPTY;
}
