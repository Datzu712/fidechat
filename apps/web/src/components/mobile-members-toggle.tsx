'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Users } from 'lucide-react';
import { MembersSidebar } from '@/components/members-sidebar';

interface MobileMembersToggleProps {
    serverId: string;
}

export function MobileMembersToggle({ serverId }: MobileMembersToggleProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                    >
                        <Users className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-60">
                    <MembersSidebar serverId={serverId} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
