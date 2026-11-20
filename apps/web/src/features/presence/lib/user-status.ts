import type { UserStatus } from '@fidechat/shared';
import { Circle, type LucideIcon, Minus, Moon } from 'lucide-react';

interface StatusDisplay {
    label: string;
    /** Sort order in member lists: online first. */
    priority: number;
    /** Background for the status dot on avatars. */
    dotClass: string;
    /** Text color for the status icon in menus. */
    iconClass: string;
    icon: LucideIcon;
}

const STATUS_DISPLAY: Record<UserStatus, StatusDisplay> = {
    online: {
        label: 'Online',
        priority: 0,
        dotClass: 'bg-green-500',
        iconClass: 'text-green-500',
        icon: Circle,
    },
    idle: {
        label: 'Idle',
        priority: 1,
        dotClass: 'bg-yellow-500',
        iconClass: 'text-yellow-500',
        icon: Moon,
    },
    dnd: {
        label: 'Do Not Disturb',
        priority: 2,
        dotClass: 'bg-red-500',
        iconClass: 'text-red-500',
        icon: Minus,
    },
    offline: {
        label: 'Offline',
        priority: 3,
        dotClass: 'bg-gray-500',
        iconClass: 'text-gray-500',
        icon: Circle,
    },
};

/** How a status is shown; a user with no presence entry is offline. */
export function getStatusDisplay(status: UserStatus | undefined) {
    return STATUS_DISPLAY[status ?? 'offline'];
}

/** The statuses users can pick for themselves. */
export const SELECTABLE_STATUSES: UserStatus[] = ['online', 'idle', 'dnd'];
