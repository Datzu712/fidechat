import type { MessagePayload } from '@fidechat/shared';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/shared/api/client';
import { useErrorToast } from '@/shared/api/use-error-toast';

/*
 * Message writes. The cache is updated by the socket echo of each write, so
 * these only report failures.
 */

function messagesUrl(guildId: string, channelId: string) {
    return `/guilds/${guildId}/channels/${channelId}/messages`;
}

export function useSendMessage(guildId: string, channelId: string) {
    const onError = useErrorToast('Failed to send message');
    return useMutation<void, AxiosError, MessagePayload>({
        mutationFn: async (payload) => {
            await apiClient.post(messagesUrl(guildId, channelId), payload);
        },
        onError,
    });
}

export function useEditMessage(guildId: string, channelId: string) {
    const onError = useErrorToast('Failed to update message');
    return useMutation<
        void,
        AxiosError,
        { messageId: string; content: string }
    >({
        mutationFn: async ({ messageId, content }) => {
            await apiClient.patch(
                `${messagesUrl(guildId, channelId)}/${messageId}`,
                { content },
            );
        },
        onError,
    });
}

export function useDeleteMessage(guildId: string, channelId: string) {
    const onError = useErrorToast('Failed to delete message');
    return useMutation<void, AxiosError, { messageId: string }>({
        mutationFn: async ({ messageId }) => {
            await apiClient.delete(
                `${messagesUrl(guildId, channelId)}/${messageId}`,
            );
        },
        onError,
    });
}
