import type { SocketEvents } from '../../enums/index.js';
import type { StatusUpdate } from './status-update.interface.js';

export interface ClientToServerEvents {
    [SocketEvents.UPDATE_CURRENT_STATUS]: (update: StatusUpdate) => void;
}
