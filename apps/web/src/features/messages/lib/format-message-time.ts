/** Time for today's messages, short date for older ones. */
export function formatMessageTime(timestamp: string) {
    const date = new Date(timestamp);
    if (date.toDateString() === new Date().toDateString()) {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
