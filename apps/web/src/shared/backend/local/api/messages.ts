import type { MessageBackend } from '@/shared/backend/backend';
import { request } from '@/shared/backend/local/tab/replica/server-link';

export const messageBackend: MessageBackend = {
    async createMessage({ guildId, channelId }, payload) {
        await request({ op: 'createMessage', guildId, channelId, payload });
    },

    async updateMessage({ guildId, channelId, messageId }, payload) {
        await request({
            op: 'updateMessage',
            guildId,
            channelId,
            messageId,
            payload,
        });
    },

    async deleteMessage({ guildId, channelId, messageId }) {
        await request({ op: 'deleteMessage', guildId, channelId, messageId });
    },
};
