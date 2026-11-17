export function FullScreenSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen w-full">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
    );
}
