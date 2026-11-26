import type { UserStatus } from '@fidechat/shared';
import { type ReactNode, useId } from 'react';

import { getStatusDisplay } from '@/features/presence/lib/user-status';
import { cn } from '@/shared/lib/utils';

/** The part cut out of the status dot, as in Discord. */
const CUTOUTS: Record<UserStatus, ReactNode> = {
    online: null,
    idle: <circle cx="2.5" cy="2.5" r="3.75" />,
    dnd: <rect x="2" y="3.75" width="6" height="2.5" rx="1.25" />,
    offline: <circle cx="5" cy="5" r="2.5" />,
};

interface StatusIconProps {
    status: UserStatus | undefined;
    className?: string;
}

export function StatusIcon({ status = 'offline', className }: StatusIconProps) {
    const maskId = useId();

    return (
        <svg
            viewBox="0 0 10 10"
            aria-hidden="true"
            className={cn(getStatusDisplay(status).colorClass, className)}
        >
            <mask id={maskId}>
                <circle cx="5" cy="5" r="5" fill="white" />
                <g fill="black">{CUTOUTS[status]}</g>
            </mask>
            <rect
                width="10"
                height="10"
                fill="currentColor"
                mask={`url(#${maskId})`}
            />
        </svg>
    );
}
