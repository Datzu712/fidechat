import type { AppUser, GuildUser } from '@/infrastructure/database/schema';
import type { Channel } from '@/modules/channel/channel.repository';
import type { Guild } from '@/modules/guild/guild.repository';
import type { Message } from '@/modules/message/message.repository';
import type { Server, Socket } from 'socket.io';

declare interface ClientToServerEvents {
    ping: () => void;
    updateCurrentClientStatus: (status: SocketUserStatus) => void;
}

declare interface InterServerEvents {
    ping: () => void;
}

declare interface SocketData {
    /** Set by the gateway's handshake middleware: every connected socket has it. */
    user?: IReqUser;
}

declare global {
    interface ServerToClientEvents {
        guildCreate: (guildData: Guild) => void;
        channelCreate: (channelData: Channel) => void;
        ping: () => void;
        welcome: (message: string) => void;
        messageCreate: (data: Message) => void;
        memberAdd: (data: { user: AppUser; memberMetadata: GuildUser }) => void;
        forceSync: () => void;
        messageUpdate: (data: { messageId: string; content: string }) => void;
        messageDelete: (messageId: string) => void;
        userStatusUpdate: (data: Array<{ userId: string; status: SocketUserStatus }>) => void;
    }
    type SocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    type SocketClient = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
}
