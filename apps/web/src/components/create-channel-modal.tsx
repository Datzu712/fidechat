'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMockData } from '@/src/components/mock-data-provider';
import { useToast } from '@/src/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
}

export function CreateChannelModal({
    isOpen,
    onClose,
    serverId,
}: CreateChannelModalProps) {
    const [channelName, setChannelName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { createChannel } = useMockData();
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            const channel = await createChannel(channelName, serverId);

            toast({
                title: 'Channel created',
                description: `#${channelName} has been created successfully.`,
            });

            router.push(`/channels/${serverId}/${channel.id}`);
            router.refresh();
            onClose();
            setChannelName('');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create channel',
                description:
                    error.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a new channel</DialogTitle>
                    <DialogDescription>
                        Channels are where your members communicate. They're
                        best organized around topics.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Channel name</Label>
                            <Input
                                id="name"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                placeholder="new-channel"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !channelName.trim()}
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
