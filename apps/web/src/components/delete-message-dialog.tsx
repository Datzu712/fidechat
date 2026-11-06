import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import type { Message } from '@/types';

interface MessagePreviewProps {
    message: Message;
    username: string;
    avatarUrl?: string;
}

function MessagePreview({ message, username, avatarUrl }: MessagePreviewProps) {
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="relative mt-4 mb-6">
            <div className="absolute inset-0 bg-linear-to-b from-zinc-800/80 to-zinc-900/80 blur-xs"></div>
            <div className="relative flex items-start gap-3 p-4 bg-zinc-800/30 rounded-md border border-zinc-700/50 shadow-lg backdrop-blur-xs">
                <div className="relative">
                    <div className="absolute inset-0 bg-zinc-900/50 rounded-full blur-[2px]"></div>
                    <UserAvatar
                        username={username}
                        avatarUrl={avatarUrl}
                        className="h-10 w-10 mt-1 relative"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-white drop-shadow-xs">
                            {username}
                        </span>
                        <span className="text-xs text-zinc-400">
                            {formatTime(new Date(message.createdAt))}
                        </span>
                    </div>
                    <p className="text-zinc-200 wrap-break-word leading-relaxed">
                        {message.content}
                    </p>
                </div>
            </div>
        </div>
    );
}

interface DeleteMessageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
    message?: Message;
    username?: string;
    avatarUrl?: string;
}

export function DeleteMessageDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    message,
    username = 'Unknown User',
    avatarUrl,
}: DeleteMessageDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Delete Message
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 pt-2">
                        Are you sure you want to delete this message? This
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {message && (
                    <MessagePreview
                        message={message}
                        username={username}
                        avatarUrl={avatarUrl}
                    />
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="hover:bg-zinc-700/50"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
