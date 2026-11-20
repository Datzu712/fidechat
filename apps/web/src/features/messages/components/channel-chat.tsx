import type { Channel } from '@fidechat/shared';

import { ChannelHeader } from '@/features/messages/components/channel-header';
import { MessageComposer } from '@/features/messages/components/message-composer';
import { MessageList } from '@/features/messages/components/message-list';
import { TypingIndicator } from '@/features/messages/components/typing-indicator';

export function ChannelChat({ channel }: { channel: Channel }) {
    return (
        <div className="bg-discord-chat flex flex-col h-full flex-1 min-w-0">
            <ChannelHeader channel={channel} />
            <MessageList channel={channel} />
            <TypingIndicator channelId={channel.id} />
            <MessageComposer channel={channel} />
        </div>
    );
}
