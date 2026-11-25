import type { AppUser, AuthMe } from '@fidechat/shared';

import type { LocalBackend } from '@/shared/backend/local/local-backend';
import type { UserList } from '@/shared/backend/local/protocol';
import { request } from '@/shared/backend/local/tab/replica/server-link';
import {
    leave,
    setStoredUser,
    storedUserId,
} from '@/shared/backend/local/tab/replica/session';
import { getTab } from '@/shared/backend/local/tab/replica/worker';

export const sessionBackend: Pick<
    LocalBackend,
    'getSession' | 'logout' | 'listUsers' | 'createUser' | 'enterAs'
> = {
    async getSession() {
        try {
            getTab();
        } catch (error) {
            // For example an insecure context, which has no Web Locks.
            console.error(
                new Error('Could not start the local tab', { cause: error }),
            );
            return null;
        }
        if (storedUserId() === null) return null;

        let me: AuthMe | null;
        try {
            me = await request<AuthMe | null>({ op: 'me' });
        } catch (error) {
            // No server answered: keep the user, the next check may succeed.
            console.error(
                new Error('Could not check the session', { cause: error }),
            );
            return null;
        }
        if (me === null) {
            // The stored user is gone: drop it, and its presence on the server.
            setStoredUser(null);
        }
        return me;
    },

    async logout() {
        leave();
    },

    listUsers() {
        return request<UserList>({ op: 'listUsers' });
    },

    createUser(username) {
        return request<AppUser>({ op: 'createUser', username });
    },

    enterAs(userId) {
        setStoredUser(userId);
    },
};
