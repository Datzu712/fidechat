/** The master's model worker, every tab and the server worker share it. */
export const MODEL_CHANNEL_NAME = 'fidechat-local-model';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GenerateInput {
    messages: ChatMessage[];
    temperature: number;
    maxNewTokens: number;
}

export interface Generated {
    text: string;
    truncated: boolean;
}

export type ModelState =
    | { status: 'off' }
    | { status: 'unsupported'; reason: string }
    /** `progress` goes from 0 to 1. */
    | { status: 'loading'; modelId: string; progress: number }
    | { status: 'ready'; modelId: string }
    | { status: 'error'; modelId: string; reason: string };

export type ModelMessage =
    | { type: 'who' }
    /** `boot` marks the worker's first state after it starts. */
    | { type: 'state'; state: ModelState; boot?: true }
    /** `restore` is a tab's automatic reload: it only uses cached files. */
    | { type: 'load'; modelId: string; restore?: boolean }
    /** Asks the master to drop the model and delete its downloaded files. */
    | { type: 'clearCache' }
    | ({ type: 'generate'; requestId: string } & GenerateInput)
    | { type: 'generated'; requestId: string; result: Generated | null };
