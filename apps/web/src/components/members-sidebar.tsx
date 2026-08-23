'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/user-avatar';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppContext from '@/hooks/useAppContext';
import { AppUser } from '@/types';
import { getUserStatusPriority } from '@/lib/utils/getUserDisplayPriority';

interface MembersSidebarProps {
    serverId: string;
    className?: string;
}

const unknownUser: Omit<AppUser, 'email'> = {
    id: '',
    username: 'Unknown',
    avatarUrl: '',
    isBot: true,
};

export function MembersSidebar({ serverId, className }: MembersSidebarProps) {
    const { guilds, currentUser, users, getUserStatus } = useAppContext();
    const server = guilds.find((s) => s.id === serverId);

    if (!server || !currentUser) return null;

    const owner = users.find((u) => u.id === server.ownerId);
    const regularMembers = users
        .filter(
            (usr) =>
                server.members?.some((member) => member.userId === usr.id) &&
                !(owner?.id === usr.id) &&
                !usr.isBot,
        )
        .sort((a, b) => {
            const statusA = getUserStatus(a.id);
            const statusB = getUserStatus(b.id);
            return (
                getUserStatusPriority(statusA) - getUserStatusPriority(statusB)
            );
        });

    const bots = users.filter((usr) => usr.isBot);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'idle':
                return 'bg-yellow-500';
            case 'dnd':
                return 'bg-red-500';
            case 'offline':
            case undefined:
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online':
                return 'Online';
            case 'idle':
                return 'Away';
            case 'dnd':
                return 'Do Not Disturb';
            case 'offline':
            case undefined:
                return 'Offline';
            default:
                return 'Unknown';
        }
    };

    const renderMemberGroup = (
        title: string,
        membersList: Omit<AppUser, 'email'>[],
    ) => {
        if (membersList.length === 0) return null;

        return (
            <div className="mb-4">
                <div className="flex items-center px-2 py-1 mb-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        {title} — {membersList.length}
                    </h3>
                </div>
                <div className="space-y-1">
                    {membersList.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 px-2 py-1 rounded hover:bg-zinc-800/50 cursor-pointer group"
                        >
                            <div className="relative">
                                <UserAvatar
                                    username={member?.username}
                                    avatarUrl={member.avatarUrl}
                                    className="h-8 w-8"
                                />
                                <div
                                    className={cn(
                                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-800',
                                        //getStatusColor(member.user.status),
                                        getStatusColor(
                                            getUserStatus(member.id) ||
                                                'offline',
                                        ),
                                    )}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium text-zinc-300 truncate group-hover:text-white">
                                        {member.username}
                                    </span>
                                    {!!member.isBot && (
                                        <span className="ml-1 px-1 text-[10px] font-bold bg-[#5865F2] text-white rounded">
                                            BOT
                                        </span>
                                    )}
                                    {member.id === server.ownerId && (
                                        <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="text-xs text-zinc-500 truncate">
                                    {/* {getStatusText(member.user.status)} */}
                                    {getStatusText(
                                        getUserStatus(member.id) || 'offline',
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

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
                    {renderMemberGroup('Owner', [owner ?? unknownUser])}
                    {renderMemberGroup('Bots', bots)}
                    {/* {renderStatusGroup(
                        'online',
                        adminsByStatus.online,
                        membersByStatus.online,
                    )} */}
                    {renderMemberGroup('Members', regularMembers)}
                </div>
            </ScrollArea>
        </div>
    );
}
