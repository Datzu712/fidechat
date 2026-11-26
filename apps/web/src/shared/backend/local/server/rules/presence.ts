import {
    type ConnectedUser,
    type StatusUpdate,
    USER_STATUSES,
} from '@fidechat/shared';
import * as z from 'zod/mini';

/**
 * The fields a client may change; others are dropped. `z.guid()` takes any
 * 8-4-4-4-12 hex id in either case, while `z.uuid()` also checks the version
 * and variant bits.
 */
const statusUpdateSchema = z.object({
    status: z.optional(z.enum(USER_STATUSES)),
    isTyping: z.optional(z.boolean()),
    typingInChannel: z.optional(z.guid()),
});

/**
 * Who is online, per tab: a user is online while at least one of their tabs
 * is registered. Status updates are validated like the api's
 * `parseStatusUpdate`.
 */
export class Presence {
    readonly #tabs = new Map<string, string>();
    readonly #users = new Map<string, Omit<ConnectedUser, 'userId'>>();
    readonly #alwaysOnline = new Set<string>();

    /** Each method returns whether `activeUsers` changed. */
    register(tabId: string, userId: string | null): boolean {
        const current = this.#tabs.get(tabId) ?? null;
        if (current === userId) return false;

        const left = this.unregister(tabId);
        if (userId === null) return left;

        this.#tabs.set(tabId, userId);
        if (this.#users.has(userId)) return left;

        this.#users.set(userId, { status: 'online', isTyping: false });
        return true;
    }

    unregister(tabId: string): boolean {
        const userId = this.#tabs.get(tabId);
        if (userId === undefined) return false;

        this.#tabs.delete(tabId);
        const hasOtherTab = [...this.#tabs.values()].includes(userId);
        if (hasOtherTab || this.#alwaysOnline.has(userId)) return false;

        return this.#users.delete(userId);
    }

    /** The user comes from the tab, never from `data`. */
    update(tabId: string, data: unknown): boolean {
        const userId = this.#tabs.get(tabId);
        if (userId === undefined) return false;
        const current = this.#users.get(userId);
        if (!current) return false;

        const update = parseStatusUpdate(data);
        if (!update) return false;

        const next = { ...current, ...update };
        const same =
            next.status === current.status &&
            next.isTyping === current.isTyping &&
            next.typingInChannel === current.typingInChannel;
        if (same) return false;

        this.#users.set(userId, next);
        return true;
    }

    /** Users with no tab (the bots) that are online even after `clear()`. */
    setAlwaysOnline(userIds: string[]): void {
        for (const userId of userIds) {
            this.#alwaysOnline.add(userId);
            if (!this.#users.has(userId)) {
                this.#users.set(userId, { status: 'online', isTyping: false });
            }
        }
    }

    setTyping({
        userId,
        channelId,
        typing,
    }: {
        userId: string;
        channelId: string;
        typing: boolean;
    }): boolean {
        const current = this.#users.get(userId);
        if (!current) return false;
        if (typing) {
            if (current.isTyping && current.typingInChannel === channelId) {
                return false;
            }
            this.#users.set(userId, {
                status: current.status,
                isTyping: true,
                typingInChannel: channelId,
            });
            return true;
        }
        if (!current.isTyping) return false;

        this.#users.set(userId, { status: current.status, isTyping: false });
        return true;
    }

    clear(): void {
        this.#tabs.clear();
        this.#users.clear();
        this.setAlwaysOnline([...this.#alwaysOnline]);
    }

    userOf(tabId: string): string | null {
        return this.#tabs.get(tabId) ?? null;
    }

    get activeUsers(): ConnectedUser[] {
        return Array.from(this.#users, ([userId, data]) => ({
            ...data,
            userId,
        }));
    }
}

/**
 * Keeps only the fields a client may change, with valid values. Returns
 * `null` when a value is invalid or nothing is left.
 */
function parseStatusUpdate(data: unknown): StatusUpdate | null {
    const result = statusUpdateSchema.safeParse(data);
    if (!result.success) return null;
    // zod keeps a key given as undefined; it counts as absent.
    const update: StatusUpdate = Object.fromEntries(
        Object.entries(result.data).filter(([, value]) => value !== undefined),
    );
    return Object.keys(update).length ? update : null;
}
