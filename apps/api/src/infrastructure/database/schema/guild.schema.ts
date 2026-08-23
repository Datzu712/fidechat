import { boolean, index, pgTable, primaryKey, uuid, varchar } from 'drizzle-orm/pg-core';

import { appUser } from './app-user.schema';

/** Equivalente Postgres de la antigua tabla Oracle `GUILD`. */
export const guild = pgTable(
    'guild',
    {
        id: uuid('id').primaryKey(),
        name: varchar('name', { length: 100 }).notNull(),
        iconUrl: varchar('icon_url', { length: 500 }),
        isPublic: boolean('is_public').default(false).notNull(),
        ownerId: uuid('owner_id')
            .notNull()
            .references(() => appUser.id, { onDelete: 'cascade' }),
        description: varchar('description', { length: 300 }),
    },
    (t) => [index('guild_owner_id_idx').on(t.ownerId), index('guild_is_public_idx').on(t.isPublic)],
);

/**
 * Miembros de un guild (antigua `GUILD_USERS`).
 *
 * En Oracle las FK no tenian ON DELETE CASCADE, asi que borrar un guild fallaba
 * mientras tuviera miembros. Aqui cascadean, que es lo que la app siempre asumio.
 */
export const guildUsers = pgTable(
    'guild_users',
    {
        guildId: uuid('guild_id')
            .notNull()
            .references(() => guild.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => appUser.id, { onDelete: 'cascade' }),
    },
    (t) => [primaryKey({ columns: [t.guildId, t.userId] }), index('guild_users_user_id_idx').on(t.userId)],
);

export type Guild = typeof guild.$inferSelect;
export type NewGuild = typeof guild.$inferInsert;
export type GuildUser = typeof guildUsers.$inferSelect;
