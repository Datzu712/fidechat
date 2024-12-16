import { IChannel, IExtendedChannel } from '../interfaces/channel';
import type { IMessage } from '../interfaces/message';
import { sortChannels } from '../utils/sortChannels';

export class ApiError extends Error {
    constructor(public res: Response) {
        super(res.statusText);
    }

    get statusCode() {
        return this.res.status;
    }

    get statusText() {
        return this.res.statusText;
    }

    get json() {
        return this.res.json();
    }

    get isUnauthorized(): boolean {
        return this.res.status === 401 || this.res.status === 403;
    }
}

export async function createMessage(
    message: Omit<IMessage, 'id' | 'createdAt'>,
) {
    const response = await fetch(
        import.meta.env.VITE_API_URL +
            `/api/channels/${message.channelId}/messages`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
            credentials: 'include',
        },
    );
    if (response.ok) {
        const data = await response.json();
        return data;
    }

    throw new ApiError(response);
}

export async function getChannels(): Promise<IExtendedChannel[]> {
    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/channels`,
        {
            credentials: 'include',
        },
    );

    if (!response.ok) {
        throw new ApiError(response);
    }

    const data = await response.json();
    return sortChannels(data);
}

/**
 * @throws { ApiError }
 * @returns { Promise<string> }
 */
export async function getWebsocketConnection() {
    const response = await fetch(
        import.meta.env.VITE_API_URL + '/api/auth/ws/token',
        {
            method: 'POST',
            credentials: 'include',
        },
    );
    if (response.status === 401 || response.status === 403) {
        throw new ApiError(response);
    }

    const res = await response.json();
    return res.token;
}

export async function createChannel(
    channel: Omit<IChannel, 'id' | 'createdAt' | 'updatedAt'>,
) {
    const response = await fetch(
        import.meta.env.VITE_API_URL + '/api/channels',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(channel),
            credentials: 'include',
        },
    );
    if (response.ok) {
        const data = await response.json();
        return data;
    }

    throw new ApiError(response);
}

export async function pingDatabase() {
    const response = await fetch(import.meta.env.VITE_API_URL + '/api/ping', {
        credentials: 'include',
    });
    if (response.ok) {
        const data = await response.json();
        return data.ping;
    }

    throw new ApiError(response);
}

export async function getUsers() {
    const response = await fetch(import.meta.env.VITE_API_URL + '/api/users', {
        credentials: 'include',
    });
    if (response.ok) {
        const data = await response.json();
        return data;
    }
}

export async function updateChannel(updatedChannel: IExtendedChannel) {
    const response = await fetch(
        import.meta.env.VITE_API_URL + `/api/channels/${updatedChannel.id}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedChannel),
            credentials: 'include',
        },
    );
    if (response.ok) {
        const data = await response.json();
        return data;
    }

    throw new ApiError(response);
}

export async function deleteChannel(channelId: string) {
    const response = await fetch(
        import.meta.env.VITE_API_URL + `/api/channels/${channelId}`,
        {
            method: 'DELETE',
            credentials: 'include',
        },
    );
    if (response.ok) {
        return;
    }

    throw new ApiError(response);
}
