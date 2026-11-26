import type { ChannelBackend } from '@/shared/backend/backend';
import { request } from '@/shared/backend/local/tab/replica/server-link';

export const channelBackend: ChannelBackend = {
    async createChannel(guildId, payload) {
        await request({ op: 'createChannel', guildId, payload });
    },
};
