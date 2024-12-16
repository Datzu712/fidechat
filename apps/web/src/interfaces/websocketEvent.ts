import type { IChannel, IExtendedChannel } from './channel';
import type { IMessage } from './message';
import type { IUser } from './user';

interface IMessageCreateEvent {
    type: 'MESSAGE_CREATE';
    payload: IMessage;
}

interface IMemberJoinEvent {
    type: 'MEMBER_JOIN';
    payload: IUser;
}

interface IChannelCreateEvent {
    type: 'CHANNEL_CREATE';
    payload: IChannel;
}

interface IChannelUpdateEvent {
    type: 'CHANNEL_UPDATE';
    payload: IExtendedChannel;
}

interface IChannelDeleteEvent {
    type: 'CHANNEL_DELETE';
    payload: string; // channelId
}

export type IWebsocketEvent =
    | IMessageCreateEvent
    | IMemberJoinEvent
    | IChannelCreateEvent
    | IChannelUpdateEvent
    | IChannelDeleteEvent;
