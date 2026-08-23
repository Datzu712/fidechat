import { bigserial, index, jsonb, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const auditOperation = pgEnum('audit_operation', ['INSERT', 'UPDATE', 'DELETE']);

/**
 * Reemplazo de la tabla `AUDITORIA` de Oracle.
 *
 * En Oracle la llenaban 5 triggers PL/SQL (TRG_AUD_*). Aqui la escriben los
 * repositorios dentro de la misma transaccion que la operacion auditada, via
 * `AuditService`.
 */
export const auditLog = pgTable(
    'audit_log',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        /** Tabla afectada, p.ej. `app_user`. */
        tableName: varchar('table_name', { length: 50 }).notNull(),
        operation: auditOperation('operation').notNull(),
        /** Rol de Postgres con el que corre la aplicacion. */
        dbUser: varchar('db_user', { length: 63 }).notNull(),
        /** Id del usuario autenticado que provoco el cambio, si se conoce. */
        appUserId: varchar('app_user_id', { length: 100 }),
        actionAt: timestamp('action_at', { withTimezone: true }).defaultNow().notNull(),
        /** Llave primaria de la fila afectada. */
        recordId: varchar('record_id', { length: 100 }),
        oldValue: jsonb('old_value'),
        newValue: jsonb('new_value'),
    },
    (t) => [
        index('audit_log_table_action_at_idx').on(t.tableName, t.actionAt),
        index('audit_log_record_id_idx').on(t.recordId),
    ],
);

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
