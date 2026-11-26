import type { ChannelBackend } from '@/shared/backend/backend';
import { apiClient } from '@/shared/backend/http/api-client';

export const channelBackend: ChannelBackend = {
    async createChannel(guildId, payload) {
        await apiClient.post(`/guilds/${guildId}/channels`, payload);
    },
};
