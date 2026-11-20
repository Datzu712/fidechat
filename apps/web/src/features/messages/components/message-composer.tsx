import type { Channel } from '@fidechat/shared';
import { Send } from 'lucide-react';
import { useRef, useState } from 'react';

import { EmojiPickerButton } from '@/features/messages/components/emoji-picker-button';
import { useSendMessage } from '@/features/messages/hooks/use-message-mutations';
import { useTypingEmitter } from '@/features/presence/hooks/use-typing-emitter';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export function MessageComposer({ channel }: { channel: Channel }) {
    const [content, setContent] = useState('');
    const input = useRef<HTMLInputElement>(null);
    const sendMessage = useSendMessage(channel.guildId, channel.id);
    const { notifyTyping, stopTyping } = useTypingEmitter(channel.id);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const text = content.trim();
        if (!text) return;

        // Clear right away and keep typing; the socket echo adds the message.
        setContent('');
        input.current?.focus();
        stopTyping();
        sendMessage.mutate(
            { content: text },
            {
                // Give the text back unless the user already wrote more.
                onError: () => setContent((current) => current || text),
            },
        );
    };

    return (
        <div className="p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                    <Input
                        ref={input}
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            notifyTyping();
                        }}
                        placeholder={`Message #${channel.name}`}
                        className="w-full bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 pr-10"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <EmojiPickerButton
                            className="h-8 w-8 p-1"
                            iconClassName="h-5 w-5"
                            onSelect={(emoji) => {
                                setContent((current) => current + emoji);
                                input.current?.focus();
                            }}
                        />
                    </div>
                </div>
                <Button type="submit" disabled={!content.trim()} size="icon">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
