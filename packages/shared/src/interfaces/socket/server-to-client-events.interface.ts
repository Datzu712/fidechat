import type { SocketEvents } from '../../enums/index.js';
import type { AppUser } from '../entities/app-user.interface.js';
import type { Channel } from '../entities/channel.interface.js';
import type { Guild, GuildMember } from '../entities/guild.interface.js';
import type { Message } from '../entities/message.interface.js';
import type { ConnectedUser } from './connected-user.interface.js';

export interface ServerToClientEvents {
    [SocketEvents.GUILD_CREATE]: (guild: Guild) => void;
    [SocketEvents.CHANNEL_CREATE]: (channel: Channel) => void;
    [SocketEvents.MESSAGE_CREATE]: (message: Message) => void;
    [SocketEvents.MESSAGE_UPDATE]: (data: Pick<Message, 'id' | 'content'>) => void;
    [SocketEvents.MESSAGE_DELETE]: (data: Pick<Message, 'id' | 'channelId'>) => void;
    [SocketEvents.MEMBER_ADD]: (data: { user: AppUser; memberMetadata: GuildMember }) => void;
    [SocketEvents.FORCE_SYNC]: () => void;
    [SocketEvents.USER_STATUS_UPDATE]: (users: ConnectedUser[]) => void;
    welcome: (message: string) => void;
}
