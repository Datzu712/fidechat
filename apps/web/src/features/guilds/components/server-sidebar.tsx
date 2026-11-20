import { Compass, Home, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { CreateServerModal } from '@/features/guilds/components/create-server-modal';
import { DiscoverServersModal } from '@/features/guilds/components/discover-servers-modal';
import { useGuilds } from '@/features/guilds/hooks/use-guilds';
import { NameAvatar } from '@/shared/components/name-avatar';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/shared/ui/tooltip';

export function ServerSidebar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
    const guilds = useGuilds() ?? [];

    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleServerClick = (serverId: string) => {
        navigate(`/servers/${serverId}`);
    };

    return (
        <TooltipProvider>
            <div className="bg-discord-rail w-[72px] shrink-0 h-full flex flex-col items-center py-3 overflow-y-auto">
                <ScrollArea className="w-full">
                    <div className="flex flex-col items-center gap-2 px-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 transition-all"
                                    onClick={() => navigate('/servers')}
                                >
                                    <Home className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Home</TooltipContent>
                        </Tooltip>

                        <Separator className="h-[2px] w-10 bg-zinc-700 rounded-md my-2" />

                        {guilds.map((server) => {
                            const isActive = pathname.includes(server.id);
                            return (
                                <div
                                    key={server.id}
                                    className="group relative flex w-full justify-center"
                                >
                                    {/* Discord's selection pill, on the rail's left edge. */}
                                    <span
                                        className={cn(
                                            'absolute -left-3 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-white transition-[height] duration-150',
                                            isActive
                                                ? 'h-8'
                                                : 'h-2 group-hover:h-5',
                                        )}
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    'h-12 w-12 rounded-full p-0 overflow-hidden',
                                                    isActive
                                                        ? 'bg-primary/30 text-white'
                                                        : 'hover:bg-primary/20 text-zinc-400 hover:text-white',
                                                )}
                                                onClick={() =>
                                                    handleServerClick(server.id)
                                                }
                                            >
                                                <NameAvatar
                                                    name={server.name}
                                                    imageUrl={server.iconUrl}
                                                    className="h-12 w-12"
                                                    fallbackClassName="text-sm font-semibold"
                                                />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            {server.name}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            );
                        })}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-12 w-12 rounded-full bg-zinc-700 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <PlusCircle className="h-6 w-6" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                Create a server
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-12 w-12 rounded-full bg-zinc-700 hover:bg-blue-500 text-blue-500 hover:text-white transition-all"
                                    onClick={() => setIsDiscoverModalOpen(true)}
                                >
                                    <Compass className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                Discover servers
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </ScrollArea>

                <CreateServerModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />

                <DiscoverServersModal
                    isOpen={isDiscoverModalOpen}
                    onClose={() => setIsDiscoverModalOpen(false)}
                    onServerSelect={(serverId) => {
                        handleServerClick(serverId);
                        setIsDiscoverModalOpen(false);
                    }}
                />
            </div>
        </TooltipProvider>
    );
}
