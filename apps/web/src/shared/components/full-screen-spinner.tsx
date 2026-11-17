import { Loader2 } from 'lucide-react';

export function FullScreenSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen w-full message-area">
            <Loader2 className="h-8 w-8 text-zinc-400 motion-safe:animate-spin" />
        </div>
    );
}
