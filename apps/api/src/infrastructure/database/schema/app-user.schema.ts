import { boolean, index, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

/** Equivalente Postgres de la antigua tabla Oracle `APP_USER`. */
export const appUser = pgTable(
    'app_user',
    {
        /** UUID emitido por Keycloak (claim `sub`). */
        id: uuid('id').primaryKey(),
        username: varchar('username', { length: 255 }).notNull(),
        email: varchar('email', { length: 255 }).notNull(),
        isBot: boolean('is_bot').default(false).notNull(),
        avatarUrl: varchar('avatar_url', { length: 500 }),
    },
    (t) => [index('app_user_email_idx').on(t.email)],
);

export type AppUser = typeof appUser.$inferSelect;
export type NewAppUser = typeof appUser.$inferInsert;
