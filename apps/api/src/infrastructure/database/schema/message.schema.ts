import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { appUser } from './app-user.schema';
import { channel } from './channel.schema';

/** Equivalente Postgres de la antigua tabla Oracle `MESSAGE`. */
export const message = pgTable(
    'message',
    {
        id: uuid('id').primaryKey(),
        content: varchar('content', { length: 2000 }).notNull(),
        authorId: uuid('author_id')
            .notNull()
            .references(() => appUser.id, { onDelete: 'cascade' }),
        channelId: uuid('channel_id')
            .notNull()
            .references(() => channel.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [index('message_channel_id_created_at_idx').on(t.channelId, t.createdAt)],
);

export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;
