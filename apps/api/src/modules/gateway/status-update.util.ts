import { isUUID } from 'class-validator';
import { type StatusUpdate, USER_STATUSES, type UserStatus } from '@fidechat/shared';

/**
 * Client status updates are untrusted: keep only the fields a client may change, and only with valid values.
 * Returns `null` when a value is invalid or nothing is left, so the update is dropped.
 */
export function parseStatusUpdate(data: unknown): StatusUpdate | null {
    if (typeof data !== 'object' || data === null) return null;
    const { status, isTyping, typingInChannel } = data as Record<string, unknown>;
    const update: StatusUpdate = {};

    if (status !== undefined) {
        if (!USER_STATUSES.includes(status as UserStatus)) return null;
        update.status = status as UserStatus;
    }
    if (isTyping !== undefined) {
        if (typeof isTyping !== 'boolean') return null;
        update.isTyping = isTyping;
    }
    if (typingInChannel !== undefined) {
        if (!isUUID(typingInChannel)) return null;
        update.typingInChannel = typingInChannel as string;
    }

    return Object.keys(update).length ? update : null;
}
