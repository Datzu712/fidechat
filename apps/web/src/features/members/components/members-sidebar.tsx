import { Crown } from 'lucide-react';

import { useGuild } from '@/features/guilds/hooks/use-guilds';
import { useGuildMembers } from '@/features/members/hooks/use-guild-members';
import type { PublicUser } from '@/features/members/hooks/use-users';
import { useUserStatus } from '@/features/presence/hooks/use-presence';
import {
    getStatusColor,
    getStatusText,
} from '@/features/presence/lib/user-status';
import { UserAvatar } from '@/shared/components/user-avatar';
import { cn } from '@/shared/lib/utils';
import { ScrollArea } from '@/shared/ui/scroll-area';

interface MembersSidebarProps {
    serverId: string;
    className?: string;
}

const unknownUser: PublicUser = {
    id: '',
    username: 'Unknown',
    avatarUrl: '',
    isBot: true,
};

export function MembersSidebar({ serverId, className }: MembersSidebarProps) {
    const guild = useGuild(serverId);
    const groups = useGuildMembers(serverId);

    if (!guild || !groups) return null;

    return (
        <div
            className={cn(
                'w-60 h-full bg-zinc-800 flex flex-col border-l border-zinc-700',
                className,
            )}
        >
            <div className="p-3 border-b border-zinc-700">
                <h2 className="font-semibold text-sm text-zinc-200">Members</h2>
            </div>

            <ScrollArea className="flex-1 px-2 py-3">
                <div className="space-y-2">
                    <MemberGroup
                        title="Owner"
                        users={[groups.owner ?? unknownUser]}
                        ownerId={guild.ownerId}
                    />
                    <MemberGroup
                        title="Bots"
                        users={groups.bots}
                        ownerId={guild.ownerId}
                    />
                    <MemberGroup
                        title="Members"
                        users={groups.members}
                        ownerId={guild.ownerId}
                    />
                </div>
            </ScrollArea>
        </div>
    );
}

function MemberGroup({
    title,
    users,
    ownerId,
}: {
    title: string;
    users: PublicUser[];
    ownerId: string;
}) {
    if (users.length === 0) return null;

    return (
        <div className="mb-4">
            <div className="flex items-center px-2 py-1 mb-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    {title} — {users.length}
                </h3>
            </div>
            <div className="space-y-1">
                {users.map((user) => (
                    <MemberRow
                        key={user.id}
                        user={user}
                        isOwner={user.id === ownerId}
                    />
                ))}
            </div>
        </div>
    );
}

function MemberRow({ user, isOwner }: { user: PublicUser; isOwner: boolean }) {
    const status = useUserStatus(user.id);

    return (
        <div className="flex items-center gap-3 px-2 py-1 rounded hover:bg-zinc-800/50 cursor-pointer group">
            <div className="relative">
                <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    className="h-8 w-8"
                />
                <div
                    className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-800',
                        getStatusColor(status),
                    )}
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-zinc-300 truncate group-hover:text-white">
                        {user.username}
                    </span>
                    {!!user.isBot && (
                        <span className="ml-1 px-1 text-[10px] font-bold bg-primary text-white rounded">
                            BOT
                        </span>
                    )}
                    {isOwner && (
                        <Crown className="h-3 w-3 text-yellow-500 shrink-0" />
                    )}
                </div>
                <div className="text-xs text-zinc-500 truncate">
                    {getStatusText(status)}
                </div>
            </div>
        </div>
    );
}
