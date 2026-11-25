import type React from 'react';

import { Label } from '@/shared/ui/label';

export function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
            {children}
        </h2>
    );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="pb-1 text-xs font-semibold uppercase text-muted-foreground">
            {children}
        </h3>
    );
}

export function Divider() {
    return <div className="my-6 h-px bg-white/10" />;
}

/** A label (and optional description) on the left, its control on the right. */
export function SettingsRow({
    label,
    htmlFor,
    description,
    children,
}: {
    label: string;
    htmlFor?: string;
    description?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
            <div className="min-w-0 flex-1 basis-48 space-y-1">
                {htmlFor ? (
                    <Label htmlFor={htmlFor} className="text-sm font-medium">
                        {label}
                    </Label>
                ) : (
                    <p className="text-sm font-medium">{label}</p>
                )}
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
                {children}
            </div>
        </div>
    );
}
