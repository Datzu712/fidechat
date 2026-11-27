import { useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';

import { backend } from '@/shared/backend/implementation';
import { cn } from '@/shared/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

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

    const { data: publicServers, isLoading } = useQuery({
        queryKey: ['guilds', 'public'],
        queryFn: () => backend.getPublicGuilds(),
        enabled: isOpen,
    });

    const filteredServers = publicServers?.filter((server) =>
        server.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Discover Servers</DialogTitle>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                    className="group relative flex flex-col items-start space-y-3 overflow-hidden rounded-lg bg-discord-footer p-4 text-left shadow-md transition hover:-translate-y-0.5 hover:bg-popover hover:shadow-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md bg-input">
                                        {server.iconUrl ? (
                                            <img
                                                src={server.iconUrl}
                                                alt={server.name}
                                                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold text-muted-foreground">
                                                {server.name
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </span>
                                        )}
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
