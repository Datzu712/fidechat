import type { SocketEvents } from '../../enums/index.js';
import type { ConnectedUser } from './connected-user.interface.js';

export interface ClientToServerEvents {
    [SocketEvents.UPDATE_CURRENT_STATUS]: (update: Partial<ConnectedUser>) => void;
}
