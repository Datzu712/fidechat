import { SocketEvents, type UserStatus } from '@fidechat/shared';
import { Hash, LogOut, Plus, Settings } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { logout } from '@/features/auth/lib/logout';
import { CreateChannelModal } from '@/features/channels/components/create-channel-modal';
import { useGuildChannels } from '@/features/channels/hooks/use-channels';
import { useGuild } from '@/features/guilds/hooks/use-guilds';
import { useCurrentUser } from '@/features/members/hooks/use-users';
import { UserStatusMenu } from '@/features/presence/components/user-status-menu';
import { useUserStatus } from '@/features/presence/hooks/use-presence';
import { UserAvatar } from '@/shared/components/user-avatar';
import { cn } from '@/shared/lib/utils';
import { useSocket } from '@/shared/socket/use-socket';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';

export function ChannelSidebar({ serverId }: { serverId: string }) {
    const { socket } = useSocket();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const currentUser = useCurrentUser();
    const server = useGuild(serverId);
    const channels = useGuildChannels(serverId);
    const myStatus = useUserStatus(currentUser?.id ?? '');

    if (!currentUser) return null;

    const isOwner = currentUser.id === server?.ownerId;

    const handleChannelClick = (channelId: string) => {
        navigate(`/servers/${serverId}/channels/${channelId}`);
    };
    // The server echoes the change back through the presence update.
    const handleStatusChange = (status: UserStatus) => {
        socket.current?.emit(SocketEvents.UPDATE_CURRENT_STATUS, { status });
    };
    const handleLogout = () => {
        void logout();
    };

    return (
        <div className="bg-discord-sidebar w-60 h-full flex flex-col">
            <div className="p-3 h-12 flex items-center shadow-xs">
                <h2 className="font-semibold text-md truncate">
                    {server?.name || 'Server'}
                </h2>
            </div>

            <ScrollArea className="flex-1 px-3">
                <div className="mt-2">
                    <div className="flex items-center justify-between px-1 py-2">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase">
                            Text Channels
                        </h3>
                        {isOwner && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 text-zinc-400 hover:text-zinc-100"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="space-y-1">
                        {channels.map((channel) => (
                            <Button
                                key={channel.id}
                                variant="ghost"
                                className={cn(
                                    'w-full justify-start px-2 py-1.5 h-8 text-zinc-400 hover:text-zinc-100',
                                    pathname?.includes(channel.id) &&
                                        'bg-zinc-700 text-zinc-100',
                                )}
                                onClick={() => handleChannelClick(channel.id)}
                            >
                                <Hash className="h-4 w-4 mr-2" />
                                <span className="truncate">{channel.name}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </ScrollArea>

            <div className="p-3 mt-auto bg-zinc-800">
                <div className="flex items-center gap-2">
                    <UserAvatar
                        username={currentUser.username}
                        avatarUrl={currentUser.avatarUrl}
                    />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium truncate">
                            {currentUser.username.length > 12
                                ? `${currentUser.username.slice(0, 12)}...`
                                : currentUser.username}
                        </span>
                        <div className="flex items-center gap-2">
                            <UserStatusMenu
                                status={myStatus ?? 'online'}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                    </div>
                    <div className="ml-auto flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <CreateChannelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                serverId={serverId}
            />
        </div>
    );
}
