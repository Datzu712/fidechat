import { BOT_DEFINITIONS } from '@fidechat/shared';

import type { Emitted } from '@/shared/backend/local/protocol';
import type { LocalState } from '@/shared/backend/local/server/data/state';
import { loadState, saveState } from '@/shared/backend/local/server/data/store';
import type {
    RuleContext,
    RuleOutcome,
} from '@/shared/backend/local/server/rules/helpers';
import { Presence } from '@/shared/backend/local/server/rules/presence';
import type { ServerDeps } from '@/shared/backend/local/server/server';

// What the server's pieces share: the state, the queue every task runs on,
// presence and the way out to the tabs.

export interface ServerCore {
    readonly deps: ServerDeps;
    readonly presence: Presence;
    readonly state: LocalState;
    /** Saves the outcome's state when it changed; a read keeps the same one. */
    commit(outcome: Pick<RuleOutcome, 'state'>): Promise<void>;
    postEvents(events: Emitted[]): void;
    /** Posts one event to every tab. */
    broadcast(event: Emitted['event'], payload: unknown): void;
    /** Messages are handled one at a time, in arrival order. */
    enqueue(task: () => Promise<void> | void): Promise<void>;
    context(): RuleContext;
}

/** Resolves once the state is loaded, or seeded when there is none. */
export async function createCore(deps: ServerDeps): Promise<ServerCore> {
    const presence = new Presence();
    presence.setAlwaysOnline(BOT_DEFINITIONS.map(({ user }) => user.id));

    let state = await loadState(deps.store, deps.now);
    let queue = Promise.resolve();

    return {
        deps,
        presence,
        get state() {
            return state;
        },
        async commit(outcome) {
            if (outcome.state === state) return;
            state = outcome.state;
            await saveState(deps.store, state);
        },
        postEvents(events) {
            for (const event of events) deps.post({ type: 'event', ...event });
        },
        broadcast(event, payload) {
            deps.post({ type: 'event', to: 'all', event, payload });
        },
        enqueue(task) {
            const run = queue.then(task);
            queue = run.catch((error: unknown) => {
                console.error(
                    new Error('Local server task failed', { cause: error }),
                );
            });
            return queue;
        },
        context: () => ({
            newId: deps.newId,
            now: deps.now,
            connectedUsers: presence.activeUsers,
        }),
    };
}
