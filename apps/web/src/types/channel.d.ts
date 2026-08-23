import { Message } from './message';

export interface Channel {
    id: string;
    name: string;
    description?: string;
    position: number;
    guildId: string;
    description?: string;
}

export interface ChannelWithMessages extends Channel {
    messages: Message[];
}

export type CreateChannelPayload = Omit<Channel, 'id', 'guildId'>; // guildId will be provided in the URL
