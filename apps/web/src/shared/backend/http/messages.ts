import type { MessageBackend, MessageTarget } from '@/shared/backend/backend';
import { apiClient } from '@/shared/backend/http/api-client';

function messagesUrl({ guildId, channelId }: MessageTarget) {
    return `/guilds/${guildId}/channels/${channelId}/messages`;
}

export const messageBackend: MessageBackend = {
    async createMessage(target, payload) {
        await apiClient.post(messagesUrl(target), payload);
    },

    async updateMessage(ref, payload) {
        await apiClient.patch(`${messagesUrl(ref)}/${ref.messageId}`, payload);
    },

    async deleteMessage(ref) {
        await apiClient.delete(`${messagesUrl(ref)}/${ref.messageId}`);
    },
};
