import type { Guild, SyncPayload } from '@fidechat/shared';

import type { GuildBackend } from '@/shared/backend/backend';
import { request } from '@/shared/backend/local/tab/replica/server-link';

export const guildBackend: GuildBackend = {
    sync() {
        return request<SyncPayload>({ op: 'sync' });
    },

    getPublicGuilds() {
        return request<Guild[]>({ op: 'getPublicGuilds' });
    },

    async createGuild(payload) {
        await request({ op: 'createGuild', payload });
    },
};
