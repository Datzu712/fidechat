'use client';

import type React from 'react';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, Send } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { MobileMembersToggle } from '@/components/mobile-members-toggle';
import useAppContext from '@/hooks/useAppContext';
import type { ChannelWithMessages, MessageCreationAttributes } from '@/types';
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import { useToast } from '@/hooks/useToast';
import { parseAxiosError } from '@/lib/utils/resolveAxiosError';

export function ChatArea({ channel }: { channel?: ChannelWithMessages }) {
    const { toast } = useToast();
    const [messageContent, setMessageContet] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { users, guilds, currentUser } = useAppContext();

    const guildMembers = [...users, currentUser];

    const guild = guilds.find((g) => g.id === channel?.guildId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messages = useMemo(() => {
        const messages = channel?.messages || [];

        return messages.sort((a, b) => {
            return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
        });
    }, [channel]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const { mutate: sendMessage } = useApiMutation<
        void,
        MessageCreationAttributes
    >(`/guilds/${guild?.id}/channels/${channel?.id}/messages`, {
        onError: (error) => {
            toast({
                variant: 'destructive',
                title: 'Failed to create channel',
                description: parseAxiosError(error),
            });
            console.error(error);
        },
    });

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageContent.trim()) return;

        setIsLoading(true);

        sendMessage(
            {
                content: messageContent,
                channelId: channel!.id,
                authorId: currentUser!.id,
            },
            {
                onSettled: () => setIsLoading(false),
            },
        );
        setMessageContet('');
    };

    const formatMessageTime = (timestamp: string | Date) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
        } else {
            return date.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
            });
        }
    };

    if (!channel || !currentUser) return null;

    return (
        <div className="message-area flex flex-col h-full flex-1 min-w-0">
            {/* Channel Header */}
            <div className="flex items-center px-4 py-3 border-b border-zinc-700">
                <Hash className="h-5 w-5 text-zinc-400 mr-2" />
                <h1 className="font-semibold text-white">{channel.name}</h1>
                <div className="ml-4 text-sm text-zinc-400">
                    Welcome to #{channel.name}!
                </div>
                <div className="ml-auto">
                    <MobileMembersToggle serverId={channel.guildId || ''} />
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4">
                <div className="py-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Hash className="h-16 w-16 text-zinc-600 mb-4" />
                            <h3 className="text-xl font-semibold text-zinc-300 mb-2">
                                Welcome to #{channel.name}!
                            </h3>
                            <p className="text-zinc-400">
                                This is the start of the #{channel.name}{' '}
                                channel.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const messageUser = guildMembers.find(
                                (u) => u?.id === message.authorId,
                            );
                            return (
                                <div
                                    key={message.id}
                                    className="flex items-start gap-3 hover:bg-zinc-800/50 px-2 py-1 rounded"
                                >
                                    <UserAvatar
                                        username={
                                            messageUser?.username || 'Unknown'
                                        }
                                        avatarUrl={messageUser?.avatarUrl}
                                        className="h-10 w-10 mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-medium text-white">
                                                {messageUser?.username ||
                                                    'Unknown User'}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                                {formatMessageTime(
                                                    message.createdAt,
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-zinc-300 break-words">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={messageContent}
                        onChange={(e) => setMessageContet(e.target.value)}
                        placeholder={`Message #${channel.name}`}
                        disabled={isLoading}
                        className="flex-1 bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !messageContent.trim()}
                        size="icon"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
