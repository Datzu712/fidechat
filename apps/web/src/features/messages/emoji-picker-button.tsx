import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

const CATEGORIES = [
    'frequent',
    'people',
    'nature',
    'foods',
    'activity',
    'places',
    'objects',
    'symbols',
    'flags',
];

// Discord's dark palette for the picker.
const PICKER_STYLE = {
    '--em-rgb-background': '32, 34, 37',
    '--em-rgb-input': '47, 49, 54',
    '--em-rgb-color': '220, 221, 222',
    '--em-border-radius': '8px',
} as React.CSSProperties;

interface EmojiPickerButtonProps {
    onSelect: (emoji: string) => void;
    className?: string;
    iconClassName?: string;
}

/** A smiley button that opens the emoji picker above it. */
export function EmojiPickerButton({
    onSelect,
    className,
    iconClassName,
}: EmojiPickerButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const onMouseDown = (event: MouseEvent) => {
            if (!container.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen]);

    return (
        <div ref={container} className="relative">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                    'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
                    className,
                )}
                onClick={() => setIsOpen((open) => !open)}
                title="Add emoji"
            >
                <Smile className={iconClassName} />
            </Button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 z-50 shadow-lg rounded-md overflow-hidden border border-zinc-800 emoji-picker-animation">
                    <Picker
                        data={data}
                        onEmojiSelect={(emoji: { native: string }) => {
                            onSelect(emoji.native);
                            setIsOpen(false);
                        }}
                        theme="dark"
                        previewPosition="none"
                        skinTonePosition="none"
                        emojiButtonSize={28}
                        emojiSize={20}
                        maxFrequentRows={1}
                        searchPosition="top"
                        navPosition="bottom"
                        perLine={8}
                        categories={CATEGORIES}
                        set="native"
                        style={PICKER_STYLE}
                        categoryColor="#5865F2"
                    />
                </div>
            )}
        </div>
    );
}
