import type { Guild, SyncPayload } from '@fidechat/shared';

import type { GuildBackend } from '@/shared/backend/backend';
import { apiClient } from '@/shared/backend/http/api-client';

export const guildBackend: GuildBackend = {
    async sync() {
        const { data } = await apiClient.get<SyncPayload>('/users/@me/sync');
        return data;
    },

    async getPublicGuilds() {
        const { data } = await apiClient.get<Guild[]>('/guilds/public');
        return data;
    },

    async createGuild(payload) {
        await apiClient.post('/guilds', payload);
    },
};
