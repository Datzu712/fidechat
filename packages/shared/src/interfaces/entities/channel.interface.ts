import type { Message } from './message.interface.js';

export interface Channel {
    id: string;
    name: string;
    description: string | null;
    position: number;
    guildId: string;
}

export interface ChannelWithMessages extends Channel {
    messages: Message[];
}
