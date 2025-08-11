'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle } from 'lucide-react';
import { CreateServerModal } from '@/components/create-server-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useAppContext from '@/hooks/useAppContext';
import { useSession } from 'next-auth/react';

export function ServerSidebar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { status } = useSession();
    const { guilds } = useAppContext();

    const router = useRouter();
    const pathname = usePathname();

    if (status !== 'authenticated') return null;

    const handleServerClick = (serverId: string) => {
        router.push(`/servers/${serverId}`);
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
                                    onClick={() => router.push('/channels')}
                                >
                                    <i className="fa-solid fa-home fa-lg" />
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
                    </div>
                </ScrollArea>

                <CreateServerModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </TooltipProvider>
    );
}
