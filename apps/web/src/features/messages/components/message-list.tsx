import type { Channel, Message } from '@fidechat/shared';
import { Hash } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

import {
    useCurrentUser,
    useUsersById,
} from '@/features/members/hooks/use-users';
import { DeleteMessageDialog } from '@/features/messages/components/delete-message-dialog';
import { MessageItem } from '@/features/messages/components/message-item';
import { useChannelMessages } from '@/features/messages/hooks/use-channel-messages';
import {
    useDeleteMessage,
    useEditMessage,
} from '@/features/messages/hooks/use-message-mutations';

/** Within this distance of the bottom, new messages keep the list pinned. */
const NEAR_BOTTOM_PX = 120;

export function MessageList({ channel }: { channel: Channel }) {
    const messages = useChannelMessages(channel.id);
    const currentUser = useCurrentUser();
    const usersById = useUsersById();
    const editMessage = useEditMessage(channel.guildId, channel.id);
    const deleteMessage = useDeleteMessage(channel.guildId, channel.id);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [toDelete, setToDelete] = useState<Message | null>(null);

    const scroller = useRef<HTMLDivElement>(null);
    const isNearBottom = useRef(true);
    const lastMessageId = useRef<string | undefined>(undefined);

    // Follow new messages only when the reader is already at the bottom, or
    // when the new message is their own. The list is keyed by channel, so the
    // first run lands at the bottom of a freshly opened channel.
    useLayoutEffect(() => {
        const el = scroller.current;
        const last = messages.at(-1);
        if (!el || last?.id === lastMessageId.current) return;

        const isFirstRun = lastMessageId.current === undefined;
        lastMessageId.current = last?.id;
        if (isFirstRun) {
            el.scrollTop = el.scrollHeight;
        } else if (isNearBottom.current || last?.authorId === currentUser?.id) {
            // The smooth scroll's own events must not unpin the list.
            isNearBottom.current = true;
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, currentUser?.id]);

    const handleScroll = () => {
        const el = scroller.current;
        if (!el) return;
        isNearBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    };

    return (
        <>
            <div
                ref={scroller}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4"
            >
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
                        messages.map((message) => (
                            <MessageItem
                                key={message.id}
                                message={message}
                                author={usersById.get(message.authorId)}
                                isOwn={message.authorId === currentUser?.id}
                                isEditing={editingId === message.id}
                                onStartEdit={() => setEditingId(message.id)}
                                onCancelEdit={() => setEditingId(null)}
                                onSaveEdit={(content) =>
                                    editMessage.mutate(
                                        { messageId: message.id, content },
                                        {
                                            // Leave another message's editor open.
                                            onSuccess: () =>
                                                setEditingId((id) =>
                                                    id === message.id
                                                        ? null
                                                        : id,
                                                ),
                                        },
                                    )
                                }
                                onDelete={() => setToDelete(message)}
                            />
                        ))
                    )}
                </div>
            </div>

            <DeleteMessageDialog
                message={toDelete}
                author={toDelete ? usersById.get(toDelete.authorId) : undefined}
                isPending={deleteMessage.isPending}
                onOpenChange={(open) => !open && setToDelete(null)}
                onConfirm={() => {
                    if (!toDelete) return;
                    const target = toDelete;
                    deleteMessage.mutate(
                        { messageId: target.id },
                        {
                            // Leave another message's dialog open.
                            onSuccess: () =>
                                setToDelete((current) =>
                                    current === target ? null : current,
                                ),
                        },
                    );
                }}
            />
        </>
    );
}
