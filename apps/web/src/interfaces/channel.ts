import type { IMessage } from './message';

export interface IChannel {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
}

export interface IExtendedChannel extends IChannel {
    messages: IMessage[];
}
