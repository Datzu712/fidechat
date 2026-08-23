'use client';

import { Check, Circle, Moon, Minus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusOptions = [
    {
        label: 'Online',
        value: 'online',
        icon: Circle,
        color: 'text-green-500',
    },
    {
        label: 'Idle',
        value: 'idle',
        icon: Moon,
        color: 'text-yellow-500',
    },
    {
        label: 'Do Not Disturb',
        value: 'dnd',
        icon: Minus,
        color: 'text-red-500',
    },
];

type Status = 'online' | 'idle' | 'dnd' | 'offline';

interface UserStatusMenuProps {
    status: Status;
    onStatusChange: (status: Status) => void;
}

export function UserStatusMenu({
    status,
    onStatusChange,
}: UserStatusMenuProps) {
    const currentStatus =
        statusOptions.find((s) => s.value === status) || statusOptions[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="outline-none flex items-center gap-1.5 hover:bg-zinc-700/50 rounded-md px-1.5 py-0.5 cursor-pointer">
                    <currentStatus.icon
                        className={`h-3.5 w-3.5 ${currentStatus.color} stroke-[2.5]`}
                    />
                    <span className="text-xs text-zinc-400 capitalize">
                        {status === 'dnd' ? 'DnD' : status}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48 p-2">
                {statusOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                        <DropdownMenuItem
                            key={option.value}
                            className="px-3 py-2 cursor-pointer flex items-center gap-3 text-sm"
                            onClick={() =>
                                onStatusChange(option.value as Status)
                            }
                        >
                            <Icon className={`h-4 w-4 ${option.color}`} />
                            <span className="flex-1">{option.label}</span>
                            {status === option.value && (
                                <Check className="h-4 w-4 text-indigo-500" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
