import type { Channel } from '@fidechat/shared';
import { Hash } from 'lucide-react';

import { MobileMembersToggle } from '@/features/members/mobile-members-toggle';

export function ChannelHeader({ channel }: { channel: Channel }) {
    return (
        <div className="flex items-center px-4 py-3 border-b border-zinc-700">
            <Hash className="h-5 w-5 text-zinc-400 mr-2" />
            <h1 className="font-semibold text-white">{channel.name}</h1>
            <div className="ml-4 text-sm text-zinc-400">
                Welcome to #{channel.name}!
            </div>
            <div className="ml-auto">
                <MobileMembersToggle serverId={channel.guildId} />
            </div>
        </div>
    );
}
