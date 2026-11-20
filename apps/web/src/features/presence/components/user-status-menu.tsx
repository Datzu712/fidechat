import type { UserStatus } from '@fidechat/shared';
import { Check } from 'lucide-react';

import {
    getStatusDisplay,
    SELECTABLE_STATUSES,
} from '@/features/presence/lib/user-status';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

interface UserStatusMenuProps {
    status: UserStatus;
    onStatusChange: (status: UserStatus) => void;
}

export function UserStatusMenu({
    status,
    onStatusChange,
}: UserStatusMenuProps) {
    const current = getStatusDisplay(status);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="outline-hidden flex items-center gap-1.5 hover:bg-zinc-700/50 rounded-md px-1.5 py-0.5 cursor-pointer">
                    <current.icon
                        className={`h-3.5 w-3.5 ${current.iconClass} stroke-[2.5]`}
                    />
                    <span className="text-xs text-zinc-400 capitalize">
                        {status === 'dnd' ? 'DnD' : status}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48 p-2">
                {SELECTABLE_STATUSES.map((option) => {
                    const {
                        icon: Icon,
                        iconClass,
                        label,
                    } = getStatusDisplay(option);
                    return (
                        <DropdownMenuItem
                            key={option}
                            className="px-3 py-2 cursor-pointer flex items-center gap-3 text-sm"
                            onClick={() => onStatusChange(option)}
                        >
                            <Icon className={`h-4 w-4 ${iconClass}`} />
                            <span className="flex-1">{label}</span>
                            {status === option && (
                                <Check className="h-4 w-4 text-indigo-500" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
