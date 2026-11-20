import { Navigate, useParams } from 'react-router';

import { useChannel } from '@/features/channels/hooks/use-channels';
import { ChannelChat } from '@/features/messages/components/channel-chat';

export function ChannelPage() {
    const params = useParams() as { id: string; channelId: string };
    const channel = useChannel(params.id, params.channelId);

    if (!channel) return <Navigate to="/servers" replace />;

    return <ChannelChat channel={channel} />;
}
