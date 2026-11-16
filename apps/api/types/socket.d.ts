import type { ClientToServerEvents, ServerToClientEvents } from '@fidechat/shared';
import type { Server, Socket } from 'socket.io';

declare interface InterServerEvents {
    ping: () => void;
}

declare interface SocketData {
    /** Set by the gateway's handshake middleware: every connected socket has it. */
    user?: IReqUser;
}

declare global {
    type SocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    type SocketClient = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
}
