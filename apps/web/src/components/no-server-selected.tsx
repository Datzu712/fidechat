'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { CreateServerModal } from '@/components/create-server-modal';

export function NoServerSelected() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-muted">
            <div className="max-w-md text-center p-6">
                <h1 className="text-2xl font-bold mb-2">No servers yet</h1>
                <p className="text-muted-foreground mb-6">
                    You haven't joined any servers yet. Create a new server or
                    join an existing one.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => setIsModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create a Server
                    </Button>
                </div>
            </div>

            <CreateServerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
