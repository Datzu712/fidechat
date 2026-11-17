import { Compass, Home, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { CreateServerModal } from '@/features/guilds/create-server-modal';
import { DiscoverServersModal } from '@/features/guilds/discover-servers-modal';
import { useGuilds } from '@/features/guilds/use-guilds';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
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
            <div className="server-sidebar w-[72px] h-full flex flex-col items-center py-3 overflow-y-auto">
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

                        {guilds.map((server) => (
                            <Tooltip key={server.id}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            'h-12 w-12 rounded-full relative group p-0 overflow-hidden',
                                            pathname?.includes(server.id)
                                                ? 'bg-primary/30 text-white'
                                                : 'hover:bg-primary/20 text-zinc-400 hover:text-white',
                                        )}
                                        onClick={() =>
                                            handleServerClick(server.id)
                                        }
                                    >
                                        <div
                                            className={cn(
                                                'fixed left-0 bg-white rounded-r-full transition-all w-1 ',
                                                pathname?.includes(server.id)
                                                    ? 'h-8'
                                                    : 'h-2 group-hover:h-5',
                                            )}
                                        />
                                        <div className="w-full h-full rounded-full overflow-hidden">
                                            <Avatar className="h-12 w-12">
                                                {server.iconUrl ? (
                                                    <AvatarImage
                                                        src={server.iconUrl}
                                                        alt={server.name}
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <AvatarFallback className="bg-primary/30 w-full h-full flex items-center justify-center text-sm font-semibold">
                                                        {server.name
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    {server.name}
                                </TooltipContent>
                            </Tooltip>
                        ))}

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
