import { SocketEvents } from '@fidechat/shared';
import { useCallback, useEffect, useRef } from 'react';

import { useSocket } from '@/shared/socket/use-socket';

/** Typing stops being shown this long after the last keystroke. */
const TYPING_TIMEOUT_MS = 2000;

/** Tells the other users when the current user is typing in a channel. */
export function useTypingEmitter(channelId: string) {
    const { socket, connected } = useSocket();
    const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    const stopTyping = useCallback(() => {
        if (timeout.current === undefined) return;
        clearTimeout(timeout.current);
        timeout.current = undefined;
        socket.current?.emit(SocketEvents.UPDATE_CURRENT_STATUS, {
            isTyping: false,
            typingInChannel: undefined,
        });
    }, [socket]);

    const notifyTyping = useCallback(() => {
        if (!connected) return;
        if (timeout.current === undefined) {
            socket.current?.emit(SocketEvents.UPDATE_CURRENT_STATUS, {
                isTyping: true,
                typingInChannel: channelId,
            });
        } else {
            clearTimeout(timeout.current);
        }
        timeout.current = setTimeout(stopTyping, TYPING_TIMEOUT_MS);
    }, [connected, socket, channelId, stopTyping]);

    // Leaving the channel (or the page) ends the typing status.
    useEffect(() => stopTyping, [channelId, stopTyping]);

    return { notifyTyping, stopTyping };
}
