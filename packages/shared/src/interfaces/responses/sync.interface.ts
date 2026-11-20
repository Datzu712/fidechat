import type { PublicUser } from '../../types/index.js';
import type { AppUser } from '../entities/app-user.interface.js';
import type { ChannelWithMessages } from '../entities/channel.interface.js';
import type { GuildWithMembers } from '../entities/guild.interface.js';
import type { ConnectedUser } from '../socket/connected-user.interface.js';

/** `GET /users/@me/sync`: the whole client state. */
export interface SyncPayload {
    guilds: GuildWithMembers[];
    channels: ChannelWithMessages[];
    currentUser: AppUser;
    users: PublicUser[];
    connectedUsers: ConnectedUser[];
}
