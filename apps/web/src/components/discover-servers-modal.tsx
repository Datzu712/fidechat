'use client';

import type React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useApiData } from '@/lib/hooks/useApiQuery';
import type { Guild } from '@/types';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscoverServersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onServerSelect: (serverId: string) => void;
}

export function DiscoverServersModal({
    isOpen,
    onClose,
    onServerSelect,
}: DiscoverServersModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: publicServers, isLoading } = useApiData<Guild[]>(
        '/guilds/public',
        {
            queryOptions: {
                staleTime: 1000 * 60 * 5,
            },
        },
    );

    const filteredServers = publicServers?.filter((server) =>
        server.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        Discover Servers
                    </DialogTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9 pr-4"
                            placeholder="Search servers"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredServers?.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">
                                No servers found
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredServers?.map((server) => (
                                <button
                                    key={server.id}
                                    onClick={() => onServerSelect(server.id)}
                                    className="group relative overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent flex flex-col items-start text-left p-4 space-y-3"
                                >
                                    <div className="w-full aspect-video relative rounded-md overflow-hidden bg-muted">
                                        <Image
                                            src={
                                                server.iconUrl ||
                                                '/placeholder.jpg'
                                            }
                                            alt={server.name}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg truncate max-w-full">
                                            {server.name}
                                        </h3>
                                        <p
                                            className={cn(
                                                'text-sm text-muted-foreground line-clamp-2 h-10',
                                                !server.description && 'italic',
                                            )}
                                        >
                                            {server.description ||
                                                'No description available'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
