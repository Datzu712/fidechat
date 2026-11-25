import {
    createSeed,
    ensureBots,
} from '@/shared/backend/local/server/data/seed';
import {
    type LocalState,
    STATE_VERSION,
} from '@/shared/backend/local/server/data/state';

// Where the local state is kept between visits, and how the server loads,
// saves and resets it; a failed step is logged and the server keeps going.

export interface SnapshotStore {
    load(): Promise<LocalState | null>;
    save(state: LocalState): Promise<void>;
    clear(): Promise<void>;
}

/** The whole local state, saved as one value. */
export const snapshotStore: SnapshotStore = {
    async load() {
        const state = await run('readonly', (store) => store.get(KEY));
        return (state as LocalState | undefined) ?? null;
    },
    async save(state) {
        await run('readwrite', (store) => store.put(state, KEY));
    },
    async clear() {
        await run('readwrite', (store) => store.clear());
    },
};

/**
 * The saved state, or a fresh seed when there is none, it is outdated or it
 * cannot be read; with the bots and their default settings added when
 * missing, saved when that changed it.
 */
export async function loadState(
    store: SnapshotStore,
    now: () => Date,
): Promise<LocalState> {
    let saved: LocalState | null = null;
    try {
        saved = await store.load();
    } catch (error) {
        console.error(
            new Error('Could not load the local state', { cause: error }),
        );
    }
    const state = ensureBots(
        saved?.version === STATE_VERSION ? saved : createSeed(now()),
    );
    if (state !== saved) await saveState(store, state);
    return state;
}

/** A failed save is logged; the server keeps serving from memory. */
export async function saveState(
    store: SnapshotStore,
    state: LocalState,
): Promise<void> {
    try {
        await store.save(state);
    } catch (error) {
        console.error(
            new Error('Could not save the local state', { cause: error }),
        );
    }
}

/**
 * Clears the saved state and returns a fresh seed with the bots, for the
 * caller to commit; a failed clear is logged.
 */
export async function resetState(
    store: SnapshotStore,
    now: () => Date,
): Promise<LocalState> {
    try {
        await store.clear();
    } catch (error) {
        console.error(
            new Error('Could not clear the local state', { cause: error }),
        );
    }
    return ensureBots(createSeed(now()));
}

const DB_NAME = 'fidechat-local';
const STORE_NAME = 'snapshot';
const KEY = 'state';

let database: Promise<IDBDatabase> | null = null;

/** Runs one request in its own transaction and resolves once it commits. */
async function run<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = action(transaction.objectStore(STORE_NAME));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}

function open(): Promise<IDBDatabase> {
    database ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    // A failed open is retried on the next call.
    database.catch(() => {
        database = null;
    });
    return database;
}
