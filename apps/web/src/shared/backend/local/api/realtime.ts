import type { RealtimeBackend } from '@/shared/backend/backend';
import {
    connect,
    on,
    onConnectionChange,
} from '@/shared/backend/local/tab/replica/server-link';
import { getTab } from '@/shared/backend/local/tab/replica/worker';

export const realtimeBackend: RealtimeBackend = {
    connect,

    disconnect() {
        // The tab keeps its channel: it is the tab's connection to the server.
    },

    onConnectionChange,

    on,

    updateStatus(update) {
        const current = getTab();

        current.post({ type: 'status', tabId: current.tabId, update });
    },
};
