import { Settings } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';

import { localBackend } from '@/shared/backend/local/local-backend';
import { modelStatus } from '@/shared/backend/local/model/models';
import { LocalAdminDialog } from '@/shared/backend/local/ui/local-admin-dialog';
import { Button } from '@/shared/ui/button';

/** One slim bar of statuses, with a button that opens the demo settings. */
export function LocalExtras() {
    const isMaster = useSyncExternalStore(
        localBackend.onMasterChange,
        localBackend.isMaster,
    );
    const modelState = useSyncExternalStore(
        localBackend.onModelStateChange,
        localBackend.getModelState,
    );
    const [adminOpen, setAdminOpen] = useState(false);

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 bg-discord-rail text-muted-foreground text-xs py-1">
            {isMaster && (
                <>
                    <span className="rounded-sm bg-primary/30 px-1.5 py-0.5 text-foreground">
                        This tab hosts the server
                    </span>
                    <span aria-hidden>·</span>
                </>
            )}
            <span
                className={
                    modelState.status === 'ready' ? 'text-foreground' : ''
                }
            >
                {modelStatus(modelState)}
            </span>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label="Demo settings"
                onClick={() => setAdminOpen(true)}
            >
                <Settings />
            </Button>
            <LocalAdminDialog
                open={adminOpen}
                onOpenChange={setAdminOpen}
                modelState={modelState}
            />
        </div>
    );
}
