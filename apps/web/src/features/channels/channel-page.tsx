import { useParams } from 'react-router';

import { useAuth } from '@/features/auth/use-auth';
import { ChatArea } from '@/features/messages/chat-area';
import { useAppContext } from '@/features/sync/use-app-context';

export function ChannelPage() {
    const params = useParams<{
        id: string; // guildId
        channelId: string;
    }>();

    const { status } = useAuth();
    const { currentUser, channels, guilds } = useAppContext();

    if (status !== 'authenticated' || !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Check if channel exists and belongs to the server
    const channel = channels.find(
        (c) => c.id === params.channelId && c.guildId === params.id,
    );
    const server = guilds.find((s) => s.id === params.id);

    if (!channel || !server) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    const channelWithServer = {
        ...channel,
        server_id: channel.guildId, // Add this line
        server: {
            name: server.name,
        },
    };

    return <ChatArea channel={channelWithServer} />;
}
