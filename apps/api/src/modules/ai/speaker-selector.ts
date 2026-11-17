import { Injectable } from '@nestjs/common';

import { AIService } from './ai.service.js';
import type { AIBot } from './bots.js';
import type { ChannelHistoryEntry } from './prompt.js';
import { planSpeakers, type SpeakerKind } from './router.js';
import { SpontaneousCaps } from './spontaneous-caps.js';

export interface SpeakerPlan {
    /** Bots the new messages are for: named in them, or picked as addressed by the router. */
    addressed: AIBot[];
    /** Bots nobody talked to that have something to add, under their cap. */
    spontaneous: AIBot[];
    /** False when the router is off or failed: only the named bots speak, and nobody reacts. */
    routed: boolean;
}

/** Decides which bots speak in a channel: the router's picks, the bots a human named and the spontaneous caps. */
@Injectable()
export class SpeakerSelector {
    private readonly caps = new SpontaneousCaps();

    constructor(private readonly ai: AIService) {}

    /** Who answers the new human messages (`newIds`). `named` are the bots those messages name. */
    async plan(
        channelId: string,
        history: ChannelHistoryEntry[],
        newIds: ReadonlySet<string>,
        named: readonly AIBot[],
    ): Promise<SpeakerPlan> {
        const decision = this.ai.routerEnabled ? await this.ai.route(history, newIds) : null;
        const speakers = planSpeakers(decision, named, (bot) => this.underCap(channelId, bot));
        const bots = (kind: SpeakerKind) => speakers.filter((speaker) => speaker.kind === kind).map(({ bot }) => bot);

        return { addressed: bots('addressed'), spontaneous: bots('spontaneous'), routed: decision !== null };
    }

    /** Whether the router still picks `bot` now that other bots have replied. */
    async stillPicks(bot: AIBot, history: ChannelHistoryEntry[], newIds: ReadonlySet<string>): Promise<boolean> {
        const decision = await this.ai.route(history, newIds);
        return decision?.some((pick) => pick.bot === bot) ?? false;
    }

    /** A bot that has not spoken and wants to comment on the replies of `spoken`, if any, under its cap. */
    async pickReaction(
        channelId: string,
        history: ChannelHistoryEntry[],
        newIds: ReadonlySet<string>,
        spoken: readonly AIBot[],
    ): Promise<AIBot | undefined> {
        const decision = (await this.ai.route(history, newIds, spoken)) ?? [];
        return decision.find(({ bot }) => !spoken.includes(bot) && this.underCap(channelId, bot))?.bot;
    }

    /** Call it once a spontaneous reply or a reaction is posted: only a posted reply uses up the cap. */
    recordSpontaneous(channelId: string, bot: AIBot): void {
        this.caps.record(channelId, bot.user.id, Date.now());
    }

    private underCap(channelId: string, bot: AIBot): boolean {
        return this.caps.canSpeak(channelId, bot.user.id, Date.now());
    }
}
