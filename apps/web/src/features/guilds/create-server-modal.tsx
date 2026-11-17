import type { GuildPayload } from '@fidechat/shared';
import type React from 'react';
import { useState } from 'react';

import { parseAxiosError } from '@/shared/api/parse-axios-error';
import { useApiMutation } from '@/shared/api/use-api-query';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';

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

    const { mutate } = useApiMutation<void, GuildPayload>('/guilds');

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
                                checked={isPublic}
                                onCheckedChange={(checked) =>
                                    setIsPublic(checked === true)
                                }
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
