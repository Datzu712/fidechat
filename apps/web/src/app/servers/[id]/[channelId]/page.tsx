'use client';

import { useEffect } from 'react';
import { useMockData } from '@/components/mock-data-provider';
import { ChatArea } from '@/components/chat-area';
import { useRouter } from 'next/navigation';

export default function ChannelPage({
    params,
}: {
    params: { serverId: string; channelId: string };
}) {
    const router = useRouter();
    const { currentUser, channels, servers, isUserServerMember } =
        useMockData();

    useEffect(() => {
        // if (!currentUser) {
        //   router.push("/login");
        //   return;
        // }

        // Check if user is a member of this server
        if (!isUserServerMember(currentUser!.id, params.serverId)) {
            router.push('/servers');
            return;
        }
    }, [currentUser, isUserServerMember, router]);

    if (!currentUser || !isUserServerMember(currentUser.id, params.serverId)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Check if channel exists and belongs to the server
    const channel = channels.find(
        (c) => c.id === params.channelId && c.server_id === params.serverId,
    );
    const server = servers.find((s) => s.id === params.serverId);

    if (!channel || !server) {
        router.push(`/channels/${params.serverId}`);
        return null;
    }

    const channelWithServer = {
        ...channel,
        server_id: channel.server_id, // Add this line
        server: {
            name: server.name,
        },
    };

    return <ChatArea channel={channelWithServer} userId={currentUser.id} />;
}
