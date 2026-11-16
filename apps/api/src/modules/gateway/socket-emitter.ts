import { Injectable, Logger } from '@nestjs/common';
import type { ServerToClientEvents } from '@fidechat/shared';

/** Outbound events. Each socket joins a room named after its user id, so a user id is also a room. */
@Injectable()
export class SocketEmitter {
    private readonly logger = new Logger(SocketEmitter.name);
    private server!: SocketServer;

    /** Called by `SocketGateway.afterInit`, before any socket can connect. */
    public attach(server: SocketServer) {
        this.server = server;
    }

    public emitToUser<E extends keyof ServerToClientEvents>(
        userId: string,
        event: E,
        ...args: Parameters<ServerToClientEvents[E]>
    ) {
        this.server.to(userId).emit(event, ...args);
    }

    public emitToUsers<E extends keyof ServerToClientEvents>(
        userIds: string[],
        event: E,
        ...args: Parameters<ServerToClientEvents[E]>
    ) {
        if (!userIds.length) {
            this.logger.error('User IDs are required to emit to users!');
            return;
        }

        this.logger.debug(`Emitting event ${event} to users: ${userIds.join(', ')}`);

        userIds.forEach((userId) => {
            this.server.to(userId).emit(event, ...args);
        });
    }

    public broadcast<E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>) {
        this.server.emit(event, ...args);
    }
}
