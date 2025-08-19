'use client';

import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteMessageDialog } from './delete-message-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import useSocket from '@/hooks/useSocket';
import { SocketEvents } from '@/constants/socketEvents';
import { Hash, Send, Pencil, Check, X, Trash2, Smile } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { MobileMembersToggle } from '@/components/mobile-members-toggle';
import useAppContext from '@/hooks/useAppContext';
import type {
    AppUser,
    ChannelWithMessages,
    MessageCreationAttributes,
} from '@/types';
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import { useToast } from '@/hooks/useToast';
import { parseAxiosError } from '@/lib/utils/resolveAxiosError';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// todo: refactor this component in sub components D:
export function ChatArea({ channel }: { channel?: ChannelWithMessages }) {
    const { toast } = useToast();
    const {
        users,
        guilds,
        currentUser,
        connectedUsers,
        getUserById,
        getUserStatus,
    } = useAppContext();
    const { socket, connected } = useSocket();

    const typingUsers = connectedUsers
        .filter((user) => user.isTyping && user.typingInChannel === channel?.id)
        .map((d) => getUserById(d.userId))
        .filter((user): user is Omit<AppUser, 'email'> => user !== undefined);

    // Handle typing status
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleTypingStatus = () => {
        if (!connected || !currentUser || !channel) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.current?.emit(SocketEvents.UPDATE_CURRENT_STATUS, {
                userId: currentUser.id,
                isTyping: true,
                typingInChannel: channel.id,
            });
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.current?.emit(SocketEvents.UPDATE_CURRENT_STATUS, {
                userId: currentUser.id,
                isTyping: false,
                typingInChannel: undefined,
            });
        }, 2000);
    };

    // Cleanup typing timeout
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Editing/creating messages stuff
    const [messageContent, setMessageContet] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null,
    );
    const [editedContent, setEditedContent] = useState('');

    // Deleting messages stuff
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

    // Emoji picker stuff
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

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
                title: 'Failed to create message',
                description: parseAxiosError(error),
            });
            console.error(error);
        },
    });

    const { mutate: updateMessage } = useApiMutation<void, { content: string }>(
        `/guilds/${guild?.id}/channels/${channel?.id}/messages/${editingMessageId}`,
        {
            onError: (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Failed to update message',
                    description: parseAxiosError(error),
                });
                console.error(error);
            },
            method: 'PATCH',
        },
    );

    const { mutate: deleteMessage } = useApiMutation<void, void>(
        `/guilds/${guild?.id}/channels/${channel?.id}/messages/${messageToDelete}`,
        {
            onError: (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Failed to delete message',
                    description: parseAxiosError(error),
                });
                console.error(error);
            },
            method: 'DELETE',
        },
    );

    const handleUpdateMessage = (messageId: string, content: string) => {
        if (!messageId || !content.trim()) return;

        setIsLoading(true);

        updateMessage(
            { content },
            {
                onSuccess: () => {
                    toast({
                        title: 'Message updated',
                        description:
                            'Your message has been updated successfully',
                    });
                    setEditingMessageId(null);
                    setEditedContent('');
                },
                onSettled: () => {
                    setIsLoading(false);
                },
            },
        );
    };
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
                onSettled: () => {
                    setIsLoading(false);
                    // Clear typing status immediately when sending message
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }
                    setIsTyping(false);
                    socket.current?.emit(SocketEvents.UPDATE_CURRENT_STATUS, {
                        userId: currentUser!.id,
                        isTyping: false,
                        typingInChannel: undefined,
                        status: getUserStatus(currentUser!.id) || 'online',
                    });
                },
            },
        );
        setMessageContet('');
    };
    const handleStartEdit = (messageId: string, content: string) => {
        setEditingMessageId(messageId);
        setEditedContent(content);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditedContent('');
    };

    const handleSaveEdit = (messageId: string) => {
        if (!editedContent.trim()) return;

        handleUpdateMessage(messageId, editedContent);
    };

    const handleEmojiSelect = (emoji: { native: string }) => {
        if (editingMessageId) {
            setEditedContent((prev) => prev + emoji.native);
        } else {
            setMessageContet((prev) => prev + emoji.native);
        }
        setShowEmojiPicker(false);
    };

    // Close emoji picker when clicking outside or pressing escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showEmojiPicker) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showEmojiPicker]);

    const handleDeleteMessage = (messageId: string) => {
        console.log(messageId);
        setMessageToDelete(messageId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!messageToDelete) return;
        setIsLoading(true);

        deleteMessage(undefined, {
            onSuccess: () => {
                toast({
                    title: 'Message deleted',
                    description: 'Your message has been deleted successfully',
                });
                setIsDeleteDialogOpen(false);
                setMessageToDelete(null);
            },
            onError: (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Failed to delete message',
                    description: parseAxiosError(error),
                });
                console.error(error);
            },
            onSettled: () => {
                setIsLoading(false);
            },
        });
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
        <>
            <DeleteMessageDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setMessageToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                isLoading={isLoading}
                message={
                    messages.find((m) => m.id === messageToDelete) || undefined
                }
                username={
                    guildMembers.find(
                        (u) =>
                            u?.id ===
                            messages.find((m) => m.id === messageToDelete)
                                ?.authorId,
                    )?.username
                }
                avatarUrl={
                    guildMembers.find(
                        (u) =>
                            u?.id ===
                            messages.find((m) => m.id === messageToDelete)
                                ?.authorId,
                    )?.avatarUrl
                }
            />
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
                                        className="flex items-start gap-3 hover:bg-zinc-800/50 px-2 py-1 rounded group"
                                    >
                                        <UserAvatar
                                            username={
                                                messageUser?.username ||
                                                'Unknown'
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
                                                <span
                                                    className={
                                                        messageUser?.isBot
                                                            ? 'px-1 text-[10px] font-bold bg-[#5865F2] text-white rounded'
                                                            : 'hidden'
                                                    }
                                                >
                                                    BOT
                                                </span>
                                                <span className="text-xs text-zinc-400">
                                                    {formatMessageTime(
                                                        message.createdAt,
                                                    )}
                                                </span>

                                                {message.authorId ===
                                                    currentUser.id &&
                                                    editingMessageId !==
                                                        message.id && (
                                                        <div className="ml-auto flex opacity-0 group-hover:opacity-100 transition gap-1">
                                                            <button
                                                                onClick={() =>
                                                                    handleStartEdit(
                                                                        message.id,
                                                                        message.content,
                                                                    )
                                                                }
                                                                className="p-1 rounded hover:bg-zinc-700"
                                                                aria-label="Edit message"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 text-zinc-400 hover:text-white" />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteMessage(
                                                                        message.id,
                                                                    )
                                                                }
                                                                className="p-1 rounded hover:bg-red-500/20"
                                                                aria-label="Delete message"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-400" />
                                                            </button>
                                                        </div>
                                                    )}
                                            </div>

                                            {editingMessageId === message.id ? (
                                                <div className="flex flex-col space-y-2">
                                                    <div className="relative">
                                                        <Input
                                                            value={
                                                                editedContent
                                                            }
                                                            onChange={(e) =>
                                                                setEditedContent(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="bg-zinc-800 border-zinc-700 text-white pr-20"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                    'Escape'
                                                                ) {
                                                                    handleCancelEdit();
                                                                } else if (
                                                                    e.key ===
                                                                        'Enter' &&
                                                                    !e.shiftKey
                                                                ) {
                                                                    e.preventDefault();
                                                                    if (
                                                                        editedContent.trim()
                                                                    ) {
                                                                        handleSaveEdit(
                                                                            message.id,
                                                                        );
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <div className="absolute bottom-0 right-0 flex items-center gap-1 p-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                                                onClick={() =>
                                                                    setShowEmojiPicker(
                                                                        !showEmojiPicker,
                                                                    )
                                                                }
                                                                title="Add emoji"
                                                            >
                                                                <Smile className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                                                onClick={
                                                                    handleCancelEdit
                                                                }
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                                                onClick={() =>
                                                                    handleSaveEdit(
                                                                        message.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    !editedContent.trim()
                                                                }
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                                                        <span>
                                                            escape to{' '}
                                                            <span className="text-zinc-300">
                                                                cancel
                                                            </span>
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            enter to{' '}
                                                            <span className="text-zinc-300">
                                                                save
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-zinc-300 break-words">
                                                    {message.content}
                                                    {'updatedAt' in message &&
                                                        message.updatedAt !==
                                                            message.createdAt && (
                                                            <span className="text-xs text-zinc-500 ml-2">
                                                                (edited)
                                                            </span>
                                                        )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Typing Indicator */}
                <AnimatePresence>
                    {typingUsers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 py-2 text-sm text-zinc-300 bg-zinc-800/80 border-t border-zinc-700/50"
                        >
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                    <span className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                                    </span>
                                </span>
                                <span>
                                    {typingUsers.length > 5 ? (
                                        'Several people are typing...'
                                    ) : typingUsers.length === 1 ? (
                                        <span>
                                            <span className="font-medium text-white">
                                                {typingUsers[0].username}
                                            </span>{' '}
                                            is typing...
                                        </span>
                                    ) : (
                                        <span>
                                            {typingUsers
                                                .slice(0, -1)
                                                .map((user, i) => (
                                                    <React.Fragment
                                                        key={user.id}
                                                    >
                                                        <span className="font-medium text-white">
                                                            {user.username}
                                                        </span>
                                                        {i <
                                                        typingUsers.length - 2
                                                            ? ', '
                                                            : ''}
                                                    </React.Fragment>
                                                ))}
                                            {' and '}
                                            <span className="font-medium text-white">
                                                {
                                                    typingUsers[
                                                        typingUsers.length - 1
                                                    ].username
                                                }
                                            </span>{' '}
                                            are typing...
                                        </span>
                                    )}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Message Input */}
                <div className="p-4">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex gap-2 relative"
                    >
                        <div className="flex-1 relative">
                            <Input
                                value={messageContent}
                                onChange={(e) => {
                                    setMessageContet(e.target.value);
                                    handleTypingStatus();
                                }}
                                placeholder={`Message #${channel.name}`}
                                disabled={isLoading}
                                className="w-full bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 pr-10"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                                    onClick={() =>
                                        setShowEmojiPicker(!showEmojiPicker)
                                    }
                                >
                                    <Smile className="h-5 w-5" />
                                </Button>
                            </div>

                            {showEmojiPicker && (
                                <div
                                    className="absolute bottom-14 right-0 z-50"
                                    ref={emojiPickerRef}
                                >
                                    <div className="shadow-lg rounded-md overflow-hidden border border-zinc-800 emoji-picker-animation">
                                        <Picker
                                            data={data}
                                            onEmojiSelect={handleEmojiSelect}
                                            theme="dark"
                                            previewPosition="none"
                                            skinTonePosition="none"
                                            emojiButtonSize={28}
                                            emojiSize={20}
                                            maxFrequentRows={1}
                                            searchPosition="top"
                                            navPosition="bottom"
                                            perLine={8}
                                            categories={[
                                                'frequent',
                                                'people',
                                                'nature',
                                                'foods',
                                                'activity',
                                                'places',
                                                'objects',
                                                'symbols',
                                                'flags',
                                            ]}
                                            set="native"
                                            style={
                                                {
                                                    '--em-rgb-background':
                                                        '32, 34, 37', // Discord dark background
                                                    '--em-rgb-input':
                                                        '47, 49, 54', // Discord input background
                                                    '--em-rgb-color':
                                                        '220, 221, 222', // Discord text color
                                                    '--em-border-radius': '8px',
                                                } as React.CSSProperties
                                            }
                                            categoryColor="#5865F2" // Discord blue
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
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
        </>
    );
}
