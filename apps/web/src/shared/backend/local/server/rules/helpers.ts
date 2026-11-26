import {
    type AppUser,
    type ConnectedUser,
    type PublicUser,
} from '@fidechat/shared';
import * as z from 'zod/mini';

import type { Emitted, LocalRequest } from '@/shared/backend/local/protocol';
import type { LocalState } from '@/shared/backend/local/server/data/state';

/** A rejected request, with the status and message the api would answer. */
export class RuleError extends Error {
    constructor(
        readonly status: 400 | 401 | 403 | 404,
        message: string,
    ) {
        super(message);
        this.name = 'RuleError';
    }
}

export interface RuleContext {
    newId(): string;
    now(): Date;
    connectedUsers: ConnectedUser[];
}

export interface RuleOutcome {
    state: LocalState;
    events: Emitted[];
    result: unknown;
}

export type Request<Op extends LocalRequest['op']> = Extract<
    LocalRequest,
    { op: Op }
>;

export function unchanged(state: LocalState, result: unknown): RuleOutcome {
    return { state, events: [], result };
}

export function signedIn(userId: string | null): string {
    if (userId === null) throw new RuleError(401, 'Not signed in');
    return userId;
}

export const nameSchema = z
    .string({ error: 'Name is required' })
    .check(
        z.refine((name) => name.trim() !== '', { error: 'Name is required' }),
    );

/** The parsed value, or a 400 with the first issue's message. */
export function parseOrReject<T>(schema: z.ZodMiniType<T>, value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success) {
        throw new RuleError(400, result.error.issues[0].message);
    }
    return result.data;
}

export function toPublicUser({ email: _email, ...user }: AppUser): PublicUser {
    return user;
}

export function memberIds(state: LocalState, guildId: string): string[] {
    return state.members
        .filter((member) => member.guildId === guildId)
        .map((member) => member.userId);
}

export function assertMember({
    state,
    guildId,
    userId,
}: {
    state: LocalState;
    guildId: string;
    userId: string;
}): void {
    const isMember = state.members.some(
        (m) => m.guildId === guildId && m.userId === userId,
    );
    if (!isMember) throw new RuleError(403, 'Not a member of this guild');
}
