import type { TabMessage } from '@/shared/backend/local/protocol';
import type { BotResponder } from '@/shared/backend/local/server/bots/bots';
import type { ServerCore } from '@/shared/backend/local/server/core';
import { resetState } from '@/shared/backend/local/server/data/store';
import { RuleError } from '@/shared/backend/local/server/rules/helpers';
import { applyRequest } from '@/shared/backend/local/server/rules/rules';

// A tab's request: applied as the user its tab said hello with, saved before
// the response, and the response posted before the write's events.

export type RequestMessage = Extract<TabMessage, { type: 'request' }>;

export interface Requests {
    handle(message: RequestMessage): Promise<void>;
}

export function createRequests({
    core,
    bots,
}: {
    core: ServerCore;
    bots: BotResponder;
}): Requests {
    const handle = async (message: RequestMessage) => {
        const { tabId, requestId } = message;
        try {
            if (message.request.op === 'reset') {
                await reset();
                core.deps.post({
                    type: 'response',
                    tabId,
                    requestId,
                    ok: true,
                    result: null,
                });
                core.deps.post({ type: 'reset' });
                return;
            }

            const outcome = applyRequest({
                state: core.state,
                userId: core.presence.userOf(tabId),
                request: message.request,
                context: core.context(),
            });
            await core.commit(outcome);

            core.deps.post({
                type: 'response',
                tabId,
                requestId,
                ok: true,
                result: outcome.result,
            });
            core.postEvents(outcome.events);
            if (message.request.op === 'createMessage') {
                bots.onHumanMessage({
                    channelId: message.request.channelId,
                    content: message.request.payload.content,
                });
            }
        } catch (error) {
            core.deps.post({
                type: 'response',
                tabId,
                requestId,
                ok: false,
                error: toResponseError(error),
            });
        }
    };

    const reset = async () => {
        const state = await resetState(core.deps.store, core.deps.now);
        await core.commit({ state });
        core.presence.clear();
    };

    return { handle };
}

function toResponseError(error: unknown): { message: string; status: number } {
    if (error instanceof RuleError) {
        return { message: error.message, status: error.status };
    }
    console.error(new Error('Local request failed', { cause: error }));
    return { message: 'Something went wrong', status: 500 };
}
