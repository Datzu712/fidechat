import type { Message, PublicUser } from '@fidechat/shared';

import { formatMessageTime } from '@/features/messages/lib/format-message-time';
import { NameAvatar } from '@/shared/components/name-avatar';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';

interface MessagePreviewProps {
    message: Message;
    author: PublicUser | undefined;
}

function MessagePreview({ message, author }: MessagePreviewProps) {
    const username = author?.username ?? 'Unknown User';

    return (
        <div className="flex items-start gap-3 rounded-md border border-border bg-discord-chat p-3 shadow-md">
            <NameAvatar
                name={username}
                imageUrl={author?.avatarUrl}
                className="mt-0.5 h-10 w-10"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="font-medium text-foreground">
                        {username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.createdAt)}
                    </span>
                </div>
                <p className="wrap-break-word text-foreground/90">
                    {message.content}
                </p>
            </div>
        </div>
    );
}

interface DeleteMessageDialogProps {
    /** The message to confirm; the dialog is open while it is set. */
    message: Message | null;
    author: PublicUser | undefined;
    isPending: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
}

export function DeleteMessageDialog({
    message,
    author,
    isPending,
    onConfirm,
    onOpenChange,
}: DeleteMessageDialogProps) {
    return (
        <Dialog open={message !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Delete Message</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this message? This
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {message && (
                    <MessagePreview message={message} author={author} />
                )}

                <DialogFooter className="mt-2">
                    <Button
                        type="button"
                        variant="link"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
