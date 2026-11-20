import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

interface NameAvatarProps {
    /** Shown as two initials when there is no image. */
    name: string;
    imageUrl: string | null | undefined;
    className?: string;
    fallbackClassName?: string;
}

/** The avatar of a user or a server: its image, or the first two letters of its name. */
export function NameAvatar({
    name,
    imageUrl,
    className,
    fallbackClassName,
}: NameAvatarProps) {
    return (
        <Avatar className={className}>
            {imageUrl ? (
                <AvatarImage
                    src={imageUrl}
                    alt={name}
                    className="object-cover"
                />
            ) : (
                <AvatarFallback
                    className={cn('bg-primary/30', fallbackClassName)}
                >
                    {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
            )}
        </Avatar>
    );
}
