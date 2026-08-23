import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';

import { Logger } from '@/common/logger';
import { AuditService } from './audit/audit.service';
import { DbUserProvider, DRIZZLE, DrizzleProvider, PG_POOL, PgPoolProvider } from './drizzle.provider';

@Global()
@Module({
    providers: [PgPoolProvider, DrizzleProvider, DbUserProvider, AuditService],
    exports: [DRIZZLE, PG_POOL, AuditService],
})
export class DatabaseModule implements OnApplicationShutdown {
    private readonly logger = new Logger(DatabaseModule.name);

    constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

    async onApplicationShutdown() {
        await this.pool.end();
        this.logger.log('Postgres pool closed');
    }
}
