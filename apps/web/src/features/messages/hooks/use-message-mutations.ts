import type { MessagePayload } from '@fidechat/shared';
import { useMutation } from '@tanstack/react-query';

import { useErrorToast } from '@/shared/api/use-error-toast';
import type { BackendError } from '@/shared/backend/backend';
import { backend } from '@/shared/backend/implementation';

/*
 * Message writes. The cache is updated by the socket echo of each write, so
 * these only report failures.
 */

export function useSendMessage(guildId: string, channelId: string) {
    const onError = useErrorToast('Failed to send message');
    return useMutation<void, BackendError, MessagePayload>({
        mutationFn: (payload) =>
            backend.createMessage({ guildId, channelId }, payload),
        onError,
    });
}

export function useEditMessage(guildId: string, channelId: string) {
    const onError = useErrorToast('Failed to update message');
    return useMutation<
        void,
        BackendError,
        { messageId: string; content: string }
    >({
        mutationFn: ({ messageId, content }) =>
            backend.updateMessage(
                { guildId, channelId, messageId },
                { content },
            ),
        onError,
    });
}

export function useDeleteMessage(guildId: string, channelId: string) {
    const onError = useErrorToast('Failed to delete message');
    return useMutation<void, BackendError, { messageId: string }>({
        mutationFn: ({ messageId }) =>
            backend.deleteMessage({ guildId, channelId, messageId }),
        onError,
    });
}
