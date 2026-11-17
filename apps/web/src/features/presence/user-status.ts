import type { UserStatus } from '@fidechat/shared';

export const getUserStatusPriority = (status: UserStatus | undefined) => {
    switch (status) {
        case 'online':
            return 0;
        case 'idle':
            return 1;
        case 'dnd':
            return 2;
        case 'offline':
        case undefined:
            return 3;
        default:
            return 4;
    }
};

export function getStatusColor(status: UserStatus | undefined): string {
    switch (status) {
        case 'online':
            return 'bg-green-500';
        case 'idle':
            return 'bg-yellow-500';
        case 'dnd':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
}

export function getStatusText(status: UserStatus | undefined): string {
    switch (status) {
        case 'online':
            return 'Online';
        case 'idle':
            return 'Away';
        case 'dnd':
            return 'Do Not Disturb';
        default:
            return 'Offline';
    }
}
