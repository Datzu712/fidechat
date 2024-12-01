import { IChannel } from '../interfaces/channel';
import type { IMessage } from '../interfaces/message';
import { useNavigate } from 'react-router-dom';

export async function createMessage(message: Omit<IMessage, 'id'>) {
    try {
        const response = await fetch(
            import.meta.env.VITE_API_URL + '/api/messages',
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
    } catch (error) {
        console.warn(error);
    }
}

export async function getChannels() {
    try {
        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/channels`,
            {
                credentials: 'include',
            },
        );

        if (!response.ok) {
            throw new Error(`Error fetching channels: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('Failed to fetch channels:', error);
        return [];
    }
}

export async function getWebsocketConnection(
    navigate: ReturnType<typeof useNavigate>,
) {
    try {
        const response = await fetch(
            import.meta.env.VITE_API_URL + '/api/auth/ws/token',
            {
                method: 'POST',
                credentials: 'include',
            },
        );
        if (response.status === 401 || response.status === 403) {
            navigate('/login');
            return null;
        }
        console.log(response.status);

        const res = await response.json();
        return res.token;
    } catch (error) {
        console.warn(error);
        return null;
    }
}

export async function createChannel(
    channel: Omit<IChannel, 'id' | 'createdAt' | 'updatedAt'>,
) {
    try {
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
    } catch (error) {
        console.warn(error);
    }
}
