import type { UserStatus } from '@fidechat/shared';

interface StatusDisplay {
    label: string;
    /** Sort order in member lists: online first. */
    priority: number;
    /** Text color for the status icon. */
    colorClass: string;
}

const STATUS_DISPLAY: Record<UserStatus, StatusDisplay> = {
    online: {
        label: 'Online',
        priority: 0,
        colorClass: 'text-green-500',
    },
    idle: {
        label: 'Idle',
        priority: 1,
        colorClass: 'text-yellow-500',
    },
    dnd: {
        label: 'Do Not Disturb',
        priority: 2,
        colorClass: 'text-red-500',
    },
    offline: {
        label: 'Offline',
        priority: 3,
        colorClass: 'text-gray-500',
    },
};

/** How a status is shown; a user with no presence entry is offline. */
export function getStatusDisplay(status: UserStatus | undefined) {
    return STATUS_DISPLAY[status ?? 'offline'];
}

/** The statuses users can pick for themselves. */
export const SELECTABLE_STATUSES: UserStatus[] = ['online', 'idle', 'dnd'];
