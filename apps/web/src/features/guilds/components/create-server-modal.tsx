import type { GuildPayload } from '@fidechat/shared';
import { useMutation } from '@tanstack/react-query';
import type React from 'react';
import { useState } from 'react';

import { useErrorToast } from '@/shared/api/use-error-toast';
import type { BackendError } from '@/shared/backend/backend';
import { backend } from '@/shared/backend/implementation';
import { NameAvatar } from '@/shared/components/name-avatar';
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
    const { toast } = useToast();
    const onError = useErrorToast('Failed to create server');

    const { mutate, isPending: isLoading } = useMutation<
        void,
        BackendError,
        GuildPayload
    >({
        mutationFn: async (payload) => {
            await backend.createGuild(payload);
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
        onError,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate({
            name: serverName,
            iconUrl: serverIconUrl || undefined,
            isPublic,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader className="text-center sm:text-center">
                    <DialogTitle>Customize Your Server</DialogTitle>
                    <DialogDescription>
                        Give your new server a personality with a name and an
                        icon. You can always change it later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="rounded-full border-2 border-dashed border-muted-foreground p-1">
                                <NameAvatar
                                    name={serverName.trim() || '?'}
                                    imageUrl={serverIconUrl}
                                    className="h-20 w-20"
                                    fallbackClassName="bg-muted text-2xl font-semibold text-muted-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Server Name{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                placeholder="Enter server name"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="iconUrl">Server Icon URL</Label>
                            <Input
                                id="iconUrl"
                                value={serverIconUrl ?? ''}
                                onChange={(e) =>
                                    setServerIconUrl(e.target.value)
                                }
                                placeholder="https://example.com/icon.png"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="isPublic"
                                checked={isPublic}
                                onCheckedChange={(checked) =>
                                    setIsPublic(checked === true)
                                }
                                disabled={isLoading}
                            />
                            <Label htmlFor="isPublic" className="font-normal">
                                Make server public
                            </Label>
                        </div>
                    </div>
                    <DialogFooter className="mt-6 sm:justify-between">
                        <Button
                            type="button"
                            variant="link"
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
