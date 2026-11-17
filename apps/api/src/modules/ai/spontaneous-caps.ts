/** Limits how often a bot may reply to a message nobody addressed to it. */
export class SpontaneousCaps {
    private readonly lastReplyAt = new Map<string, number>();

    constructor(private readonly windowMs = 10 * 60_000) {}

    canSpeak(channelId: string, botId: string, now: number): boolean {
        const last = this.lastReplyAt.get(this.key(channelId, botId));
        return last === undefined || now - last >= this.windowMs;
    }

    record(channelId: string, botId: string, now: number): void {
        this.lastReplyAt.set(this.key(channelId, botId), now);
    }

    private key(channelId: string, botId: string): string {
        return `${channelId}:${botId}`;
    }
}
