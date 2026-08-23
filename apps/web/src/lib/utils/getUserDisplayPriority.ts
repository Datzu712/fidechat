import { SocketUserStatus } from '@/types';

export const getUserStatusPriority = (status: SocketUserStatus) => {
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
