import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
    username: string;
    avatarUrl: string | null | undefined;
    className?: string;
}

export function UserAvatar({
    username,
    avatarUrl,
    className,
}: UserAvatarProps) {
    return (
        <Avatar className={className}>
            {avatarUrl ? (
                <AvatarImage
                    src={avatarUrl || '/placeholder.svg'}
                    alt={username}
                />
            ) : (
                <AvatarFallback className="bg-primary/30">
                    {username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
            )}
        </Avatar>
    );
}
