'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMockData } from '@/components/mock-data-provider';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateServerModal({ isOpen, onClose }: CreateServerModalProps) {
    const [serverName, setServerName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { createServer } = useMockData();
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            // const server = await createServer(serverName);
            // toast({
            //     title: 'Server created',
            //     description: `${serverName} has been created successfully.`,
            // });
            // router.push(`/channels/${server.id}`);
            // router.refresh();
            // onClose();
            // setServerName('');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to create server',
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
                    <DialogTitle>Create a new server</DialogTitle>
                    <DialogDescription>
                        Your server is where you and your friends hang out. Make
                        yours and start talking.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Server name</Label>
                            <Input
                                id="name"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                placeholder="Enter server name"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Server Icon URL</Label>
                            <Input
                                id="iconUrl"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                placeholder="Put your server icon URL here"
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
                            disabled={isLoading || !serverName.trim()}
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
