'use client';

import { ChatArea } from '@/components/chat-area';
import { useParams } from 'next/navigation';
import useAppContext from '@/hooks/useAppContext';
import { useSession } from 'next-auth/react';

export default function ChannelPage() {
    const params = useParams<{
        id: string; // guildId
        channelId: string;
    }>();

    const { status } = useSession();
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
