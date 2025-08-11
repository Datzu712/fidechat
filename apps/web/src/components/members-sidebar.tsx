'use client';

import { useMockData } from '@/src/components/mock-data-provider';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { UserAvatar } from '@/src/components/user-avatar';
import { Crown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface MembersSidebarProps {
    serverId: string;
    className?: string;
}

export function MembersSidebar({ serverId, className }: MembersSidebarProps) {
    const { getServerMembers } = useMockData();

    const members = getServerMembers(serverId);

    // Group members by role
    const admins = members.filter((member) => member.role === 'ADMIN');
    const regularMembers = members.filter((member) => member.role === 'MEMBER');

    // Group by online status
    const groupMembersByStatus = (membersList: typeof members) => {
        return {
            online: membersList.filter(
                (member) => member.user.status === 'online',
            ),
            away: membersList.filter((member) => member.user.status === 'away'),
            busy: membersList.filter((member) => member.user.status === 'busy'),
            offline: membersList.filter(
                (member) => member.user.status === 'offline',
            ),
        };
    };

    const adminsByStatus = groupMembersByStatus(admins);
    const membersByStatus = groupMembersByStatus(regularMembers);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'away':
                return 'bg-yellow-500';
            case 'busy':
                return 'bg-red-500';
            case 'offline':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online':
                return 'Online';
            case 'away':
                return 'Away';
            case 'busy':
                return 'Do Not Disturb';
            case 'offline':
                return 'Offline';
            default:
                return 'Unknown';
        }
    };

    const renderMemberGroup = (
        title: string,
        membersList: typeof members,
        showRole = false,
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
                                    username={
                                        member.nickname || member.user.username
                                    }
                                    avatarUrl={member.user.avatar_url}
                                    className="h-8 w-8"
                                />
                                <div
                                    className={cn(
                                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-800',
                                        getStatusColor(member.user.status),
                                    )}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium text-zinc-300 truncate group-hover:text-white">
                                        {member.nickname ||
                                            member.user.username}
                                    </span>
                                    {showRole && member.role === 'ADMIN' && (
                                        <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="text-xs text-zinc-500 truncate">
                                    {getStatusText(member.user.status)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderStatusGroup = (
        status: string,
        adminList: typeof members,
        memberList: typeof members,
    ) => {
        const allMembers = [...adminList, ...memberList];
        if (allMembers.length === 0) return null;

        return renderMemberGroup(getStatusText(status), allMembers, true);
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
                    {/* Online Members */}
                    {renderStatusGroup(
                        'online',
                        adminsByStatus.online,
                        membersByStatus.online,
                    )}

                    {/* Away Members */}
                    {renderStatusGroup(
                        'away',
                        adminsByStatus.away,
                        membersByStatus.away,
                    )}

                    {/* Busy Members */}
                    {renderStatusGroup(
                        'busy',
                        adminsByStatus.busy,
                        membersByStatus.busy,
                    )}

                    {/* Offline Members */}
                    {renderStatusGroup(
                        'offline',
                        adminsByStatus.offline,
                        membersByStatus.offline,
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
