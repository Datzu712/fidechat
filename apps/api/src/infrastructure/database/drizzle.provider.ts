import { Logger, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

/** Token DI del cliente Drizzle. Reemplaza al antiguo `DATABASE_CONNECTION` de oracledb. */
export const DRIZZLE = Symbol('DRIZZLE_CONNECTION');
/** Token DI del pool de `pg` subyacente (se necesita para cerrarlo en el shutdown). */
export const PG_POOL = Symbol('PG_POOL');
/** Nombre del rol de Postgres con el que corre la app, usado por la auditoria. */
export const DB_USER = Symbol('DB_USER');

export type DrizzleDB = NodePgDatabase<typeof schema>;

/**
 * Transaccion de Drizzle. Los repositorios aceptan `DrizzleDB | DrizzleTx` para
 * poder componer varias escrituras (incluida la auditoria) en una sola transaccion.
 */
export type DrizzleTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

export type DrizzleExecutor = DrizzleDB | DrizzleTx;

function parseDbUser(connectionString: string): string {
    try {
        return decodeURIComponent(new URL(connectionString).username) || 'unknown';
    } catch {
        return 'unknown';
    }
}

export const PgPoolProvider: Provider = {
    provide: PG_POOL,
    useFactory: async (configService: ConfigService<IEnvironmentVariables>) => {
        const connectionString = configService.getOrThrow<string>('DATABASE_URL');
        const max = Number(configService.get('DATABASE_POOL_MAX') ?? 10);
        const dbUser = parseDbUser(connectionString);

        Logger.log(`Connecting to Postgres as ${dbUser} (pool max ${max})`, 'DatabaseModule');

        const pool = new Pool({ connectionString, max });

        // Un error en un cliente ocioso no debe tumbar el proceso.
        pool.on('error', (error) => Logger.error(error, 'DatabaseModule'));

        const startTime = Date.now();
        const client = await pool.connect();
        try {
            const result = await client.query<{ table_name: string }>(
                `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
            );
            Logger.log(
                `Connected to Postgres in ${Date.now() - startTime}ms. Tables: ${
                    result.rows.map((r) => r.table_name).join(', ') || '(none - run pnpm db:migrate)'
                }`,
                'DatabaseModule',
            );
        } catch (error) {
            Logger.error(error, 'DatabaseModule');
            throw error;
        } finally {
            client.release();
        }

        return pool;
    },
    inject: [ConfigService],
};

export const DrizzleProvider: Provider = {
    provide: DRIZZLE,
    useFactory: (pool: Pool): DrizzleDB => drizzle(pool, { schema }),
    inject: [PG_POOL],
};

export const DbUserProvider: Provider = {
    provide: DB_USER,
    useFactory: (configService: ConfigService<IEnvironmentVariables>) =>
        parseDbUser(configService.getOrThrow<string>('DATABASE_URL')),
    inject: [ConfigService],
};
