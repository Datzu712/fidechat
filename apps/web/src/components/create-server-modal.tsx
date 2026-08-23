'use client';

import type React from 'react';

import { useState } from 'react';
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
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import type { CreateGuildPayload } from '@/types';
import { parseAxiosError } from '@/lib/utils/resolveAxiosError';
import { Checkbox } from './ui/checkbox';
import { useToast } from '@/hooks/useToast';

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateServerModal({ isOpen, onClose }: CreateServerModalProps) {
    const [serverName, setServerName] = useState('');
    const [serverIconUrl, setServerIconUrl] = useState<string>();
    const [isPublic, setIsPublic] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { mutate } = useApiMutation<void, CreateGuildPayload>('/guilds');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        try {
            mutate(
                { name: serverName, iconUrl: serverIconUrl, isPublic },
                {
                    onError: (error) => {
                        toast({
                            variant: 'destructive',
                            title: 'Failed to create server',
                            description: parseAxiosError(
                                error,
                                'Something went wrong. Please try again.',
                            ),
                        });
                        console.error(error);
                    },
                    onSuccess: () => {
                        toast({
                            title: 'Server created',
                            description: `${serverName} has been created successfully.`,
                        });

                        onClose();
                        setServerName('');
                        setServerIconUrl(undefined);
                    },
                },
            );
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to create server',
                description: parseAxiosError(
                    error,
                    'Something went wrong. Please try again.',
                ),
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
                    <div className="space-y-6">
                        <div>
                            <Label
                                htmlFor="name"
                                className="text-sm font-medium"
                            >
                                Server Name
                            </Label>
                            <Input
                                id="name"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                placeholder="Enter server name"
                                disabled={isLoading}
                                required
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="iconUrl"
                                className="text-sm font-medium"
                            >
                                Server Icon URL
                            </Label>
                            <Input
                                id="iconUrl"
                                value={serverIconUrl}
                                onChange={(e) =>
                                    setServerIconUrl(e.target.value)
                                }
                                placeholder="Paste your server icon URL here"
                                disabled={isLoading}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isPublic"
                                value={isPublic ? 'true' : 'false'}
                                onChange={(e) => {
                                    setIsPublic(
                                        (e.target as HTMLInputElement).checked,
                                    );
                                }}
                                disabled={isLoading}
                            />
                            <Label htmlFor="isPublic" className="text-sm">
                                Make server public
                            </Label>
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
