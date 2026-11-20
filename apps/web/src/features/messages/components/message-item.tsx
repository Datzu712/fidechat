import type { Message } from '@fidechat/shared';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import type { PublicUser } from '@/features/members/hooks/use-users';
import { EmojiPickerButton } from '@/features/messages/components/emoji-picker-button';
import { UserAvatar } from '@/shared/components/user-avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

/** Time for today's messages, short date for older ones. */
function formatMessageTime(timestamp: string) {
    const date = new Date(timestamp);
    if (date.toDateString() === new Date().toDateString()) {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface MessageItemProps {
    message: Message;
    author: PublicUser | undefined;
    isOwn: boolean;
    isEditing: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: (content: string) => void;
    onDelete: () => void;
}

export function MessageItem({
    message,
    author,
    isOwn,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDelete,
}: MessageItemProps) {
    return (
        <div className="flex items-start gap-3 hover:bg-zinc-800/50 px-2 py-1 rounded group">
            <UserAvatar
                username={author?.username || 'Unknown'}
                avatarUrl={author?.avatarUrl}
                className="h-10 w-10 mt-1"
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-medium text-white">
                        {author?.username || 'Unknown User'}
                    </span>
                    {author?.isBot && (
                        <span className="px-1 text-[10px] font-bold bg-primary text-white rounded">
                            BOT
                        </span>
                    )}
                    <span className="text-xs text-zinc-400">
                        {formatMessageTime(message.createdAt)}
                    </span>

                    {isOwn && !isEditing && (
                        <div className="ml-auto flex opacity-0 group-hover:opacity-100 transition gap-1">
                            <button
                                onClick={onStartEdit}
                                className="p-1 rounded hover:bg-zinc-700"
                                aria-label="Edit message"
                                title="Edit"
                            >
                                <Pencil className="h-3.5 w-3.5 text-zinc-400 hover:text-white" />
                            </button>
                            <button
                                onClick={onDelete}
                                className="p-1 rounded hover:bg-red-500/20"
                                aria-label="Delete message"
                                title="Delete"
                            >
                                <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-400" />
                            </button>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <MessageEditor
                        initialContent={message.content}
                        onCancel={onCancelEdit}
                        onSave={onSaveEdit}
                    />
                ) : (
                    <p className="text-zinc-300 wrap-break-word">
                        {message.content}
                    </p>
                )}
            </div>
        </div>
    );
}

function MessageEditor({
    initialContent,
    onCancel,
    onSave,
}: {
    initialContent: string;
    onCancel: () => void;
    onSave: (content: string) => void;
}) {
    const [content, setContent] = useState(initialContent);
    const canSave = content.trim().length > 0;
    const save = () => {
        if (canSave) onSave(content.trim());
    };

    return (
        <div className="flex flex-col space-y-2">
            <div className="relative">
                <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white pr-20"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            onCancel();
                        } else if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            save();
                        }
                    }}
                />
                <div className="absolute bottom-0 right-0 flex items-center gap-1 p-1">
                    <EmojiPickerButton
                        className="h-6 w-6 p-0 hover:bg-zinc-700"
                        iconClassName="h-4 w-4"
                        onSelect={(emoji) => setContent((c) => c + emoji)}
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
                        onClick={onCancel}
                        title="Cancel"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
                        onClick={save}
                        disabled={!canSave}
                        title="Save"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1">
                <span>
                    escape to <span className="text-zinc-300">cancel</span>
                </span>
                <span>•</span>
                <span>
                    enter to <span className="text-zinc-300">save</span>
                </span>
            </div>
        </div>
    );
}
