'use client';

import type React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseAxiosError } from '@/lib/utils/resolveAxiosError';
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import { CreateChannelPayload } from '@/types';

const formSchema = z.object({
    name: z.string().min(1, 'Channel name is required').max(100),
    description: z.string().max(1000).optional(),
    position: z.number().min(0).default(0),
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
    const { toast } = useToast();
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            position: 0,
        },
    });

    const { mutate, isPending: isLoading } = useApiMutation<
        void,
        CreateChannelPayload
    >(`/guilds/${serverId}/channels`, {
        onSuccess: (_, variables) => {
            toast({
                title: 'Channel created',
                description: `#${variables.name} has been created successfully.`,
            });
            form.reset();
            onClose();
        },
        onError: (error) => {
            toast({
                variant: 'destructive',
                title: 'Failed to create channel',
                description: parseAxiosError(error),
            });
            console.error(error);
        },
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a new channel</DialogTitle>
                    <DialogDescription>
                        Create a new channel in your server to start chatting.
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
                                    <FormLabel>Channel name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="new-channel"
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Channel description</FormLabel>
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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
