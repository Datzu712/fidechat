import type { Channel } from '@fidechat/shared';

import { ChannelHeader } from '@/features/messages/channel-header';
import { MessageComposer } from '@/features/messages/message-composer';
import { MessageList } from '@/features/messages/message-list';
import { TypingIndicator } from '@/features/messages/typing-indicator';

export function ChannelChat({ channel }: { channel: Channel }) {
    return (
        <div className="message-area flex flex-col h-full flex-1 min-w-0">
            <ChannelHeader channel={channel} />
            {/* Keyed by channel: switching channels resets scroll and edit state. */}
            <MessageList key={channel.id} channel={channel} />
            <TypingIndicator channelId={channel.id} />
            <MessageComposer key={channel.id} channel={channel} />
        </div>
    );
}
