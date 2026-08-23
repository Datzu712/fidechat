import { relations } from 'drizzle-orm';

import { appUser } from './app-user.schema';
import { channel } from './channel.schema';
import { guild, guildUsers } from './guild.schema';
import { message } from './message.schema';

export const appUserRelations = relations(appUser, ({ many }) => ({
    memberships: many(guildUsers),
    ownedGuilds: many(guild),
    messages: many(message),
}));

export const guildRelations = relations(guild, ({ one, many }) => ({
    owner: one(appUser, { fields: [guild.ownerId], references: [appUser.id] }),
    members: many(guildUsers),
    channels: many(channel),
}));

export const guildUsersRelations = relations(guildUsers, ({ one }) => ({
    guild: one(guild, { fields: [guildUsers.guildId], references: [guild.id] }),
    user: one(appUser, { fields: [guildUsers.userId], references: [appUser.id] }),
}));

export const channelRelations = relations(channel, ({ one, many }) => ({
    guild: one(guild, { fields: [channel.guildId], references: [guild.id] }),
    messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
    channel: one(channel, { fields: [message.channelId], references: [channel.id] }),
    author: one(appUser, { fields: [message.authorId], references: [appUser.id] }),
}));
