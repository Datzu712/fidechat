import { index, integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

import { guild } from './guild.schema';

/** Equivalente Postgres de la antigua tabla Oracle `CHANNEL`. */
export const channel = pgTable(
    'channel',
    {
        id: uuid('id').primaryKey(),
        name: varchar('name', { length: 100 }).notNull(),
        description: varchar('description', { length: 500 }),
        /** Se usa para ordenar los canales dentro del guild. */
        position: integer('position').default(0).notNull(),
        guildId: uuid('guild_id')
            .notNull()
            .references(() => guild.id, { onDelete: 'cascade' }),
    },
    (t) => [index('channel_guild_id_position_idx').on(t.guildId, t.position)],
);

export type Channel = typeof channel.$inferSelect;
export type NewChannel = typeof channel.$inferInsert;
