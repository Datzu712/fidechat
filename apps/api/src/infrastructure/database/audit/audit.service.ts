import { Inject, Injectable } from '@nestjs/common';

import { DB_USER, type DrizzleExecutor } from '../drizzle.provider.js';
import { auditLog } from '../schema/index.js';

export type AuditableTable = 'app_user' | 'guild' | 'guild_users' | 'channel' | 'message';
export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditEntry {
    table: AuditableTable;
    operation: AuditOperation;
    /** Llave primaria de la fila afectada (para `guild_users`, `guildId:userId`). */
    recordId: string;
    /** Estado previo de la fila. Se omite en INSERT. */
    before?: unknown;
    /** Estado posterior de la fila. Se omite en DELETE. */
    after?: unknown;
    /** Usuario autenticado responsable del cambio, si se conoce. */
    actorId?: string | null;
}

/**
 * Sustituye a los triggers `TRG_AUD_*` de Oracle.
 *
 * La diferencia importante con los triggers: hay que llamarlo explicitamente y
 * pasandole la transaccion en curso, para que la fila de auditoria haga commit o
 * rollback junto con la operacion que describe.
 */
@Injectable()
export class AuditService {
    constructor(@Inject(DB_USER) private readonly dbUser: string) {}

    async record(executor: DrizzleExecutor, entry: AuditEntry): Promise<void> {
        await executor.insert(auditLog).values({
            tableName: entry.table,
            operation: entry.operation,
            dbUser: this.dbUser,
            appUserId: entry.actorId ?? null,
            recordId: entry.recordId,
            oldValue: entry.before ?? null,
            newValue: entry.after ?? null,
        });
    }
}
