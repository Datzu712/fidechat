import type { LocalBackend } from '@/shared/backend/local/local-backend';
import { MASTER_LOCK } from '@/shared/backend/local/protocol';

let master = false;
export const masterListeners = new Set<(isMaster: boolean) => void>();

function becomeMaster(): Promise<never> {
    const worker = new Worker(
        new URL('../server/server.worker.ts', import.meta.url),
        { type: 'module' },
    );

    worker.onerror = (event) => {
        console.error(
            new Error('The local server worker failed', { cause: event }),
        );
    };

    const modelWorker = new Worker(
        new URL('../model/model.worker.ts', import.meta.url),
        { type: 'module' },
    );
    modelWorker.onerror = (event) => {
        console.error(
            new Error('The local model worker failed', { cause: event }),
        );
    };
    master = true;
    masterListeners.forEach((listener) => listener(true));

    // Held while this promise is pending, which is never: the tab stays master
    // until it closes.
    return new Promise<never>(() => {});
}

/** Bids for the master lock; the tab becomes master once it is granted. */
export function requestMaster() {
    void navigator.locks.request(MASTER_LOCK, becomeMaster);
}

/** Whether this tab hosts the server, for the status bar. */
export const masterStatus: Pick<LocalBackend, 'isMaster' | 'onMasterChange'> = {
    isMaster() {
        return master;
    },

    onMasterChange(listener) {
        masterListeners.add(listener);
        return () => {
            masterListeners.delete(listener);
        };
    },
};
