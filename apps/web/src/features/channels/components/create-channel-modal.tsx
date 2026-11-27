import type { ChannelPayload } from '@fidechat/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Hash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { useGuild } from '@/features/guilds/hooks/use-guilds';
import { useErrorToast } from '@/shared/api/use-error-toast';
import type { BackendError } from '@/shared/backend/backend';
import { backend } from '@/shared/backend/implementation';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

const formSchema = z.object({
    name: z.string().min(1, 'Channel name is required').max(100),
    description: z.string().max(1000).optional(),
    // No .default(0): defaultValues already sets it, and with zod 4 a default
    // makes the input type differ from the output type in useForm.
    position: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

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
    const guild = useGuild(serverId);
    const { toast } = useToast();
    const onError = useErrorToast('Failed to create channel');
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            position: 0,
        },
    });

    const { mutate, isPending: isLoading } = useMutation<
        void,
        BackendError,
        ChannelPayload
    >({
        mutationFn: async (payload) => {
            await backend.createChannel(serverId, payload);
        },
        onSuccess: (_, variables) => {
            toast({
                title: 'Channel created',
                description: `#${variables.name} has been created successfully.`,
            });
            form.reset();
            onClose();
        },
        onError,
    });

    const onSubmit = (values: FormValues) => {
        mutate({
            name: values.name,
            position: values.position,
            description: values.description || undefined,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                    <DialogDescription className="truncate text-sm">
                        in {guild?.name}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Channel Name{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FormLabel>
                                    <div className="relative">
                                        <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <FormControl>
                                            <Input
                                                placeholder="new-channel"
                                                disabled={isLoading}
                                                className="pl-9"
                                                {...field}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Channel Description</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter channel description"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            disabled={isLoading}
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="mt-6 sm:justify-between">
                            <Button
                                type="button"
                                variant="link"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Channel'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
