import type { MessagePayload } from '@fidechat/shared';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/shared/api/client';
import { parseAxiosError } from '@/shared/api/parse-axios-error';
import { useToast } from '@/shared/ui/use-toast';

/*
 * Message writes. The cache is updated by the socket echo of each write, so
 * these only report failures.
 */

function useErrorToast(title: string) {
    const { toast } = useToast();
    return (error: AxiosError) =>
        toast({
            variant: 'destructive',
            title,
            description: parseAxiosError(error),
        });
}

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
