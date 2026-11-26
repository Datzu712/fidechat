import type {
    env as transformersEnv,
    TextGenerationChatOutput,
    TextGenerationPipeline,
} from '@huggingface/transformers';

import { mergeTurns } from '@/shared/backend/local/model/merge-turns';
import {
    type Generated,
    MODEL_CHANNEL_NAME,
    type ModelMessage,
    type ModelState,
} from '@/shared/backend/local/model/model-protocol';

/**
 * Runs the bots' model in the master tab's second dedicated worker, on
 * WebGPU. Every tab and the server worker talk to it over the channel.
 */
const channel = new BroadcastChannel(MODEL_CHANNEL_NAME);
const PROGRESS_INTERVAL_MS = 250;
/** transformers.js's default `env.cacheKey`, used before the library loads. */
const DEFAULT_CACHE_NAME = 'transformers-cache';
/** The pipeline's options; the cache check must use the same ones. */
const PIPELINE_OPTIONS = { device: 'webgpu', dtype: 'q4f16' } as const;

let state: ModelState = { status: 'off' };
let generator: TextGenerationPipeline | null = null;
/** Set once the library loaded, so a clear never downloads it. */
let env: typeof transformersEnv | null = null;
/** Generations run one at a time on the single pipeline. */
let queue = Promise.resolve();
/** A load waits for a running clear, so it never fills the deleted cache. */
let clearing = Promise.resolve();
/** Every load started, settled; a clear deletes the files after them. */
let loads = Promise.resolve();
/**
 * Bumped by every load and clear. A load checks it after each wait and drops
 * its work once another load or a clear has bumped it.
 */
let loadSeq = 0;

const post = (message: ModelMessage) => channel.postMessage(message);

function setState(next: ModelState) {
    state = next;
    post({ type: 'state', state });
}

async function probe(): Promise<ModelState> {
    let adapter: GPUAdapter | null = null;
    try {
        adapter = (await navigator.gpu?.requestAdapter()) ?? null;
    } catch {
        // Treated as no adapter.
    }
    // TODO: a CPU (WASM) path needs a model export without GatherBlockQuantized (e.g. q8) or another runtime.
    if (!adapter)
        return {
            status: 'unsupported',
            reason: 'This browser has no WebGPU, which the bots need.',
        };
    if (!adapter.features.has('shader-f16'))
        return {
            status: 'unsupported',
            reason: "This device's GPU lacks 16-bit floats (shader-f16), which the bots need.",
        };
    return { status: 'off' };
}

function logDisposeError(error: unknown) {
    console.error(new Error('Could not dispose the model', { cause: error }));
}

/** Drops the pipeline; through the queue, so a running generation finishes first. */
function dropGenerator() {
    const previous = generator;
    generator = null;
    if (previous)
        queue = queue.then(() => previous.dispose()).catch(logDisposeError);
}

const cacheName = () => env?.cacheKey ?? DEFAULT_CACHE_NAME;

/**
 * Whether every file the pipeline needs for this model is in the browser
 * cache. It reads only the cache when they are: nothing is downloaded.
 */
async function isCached(modelId: string): Promise<boolean> {
    await clearing;
    try {
        const library = await import('@huggingface/transformers');
        env = library.env;
        return await library.ModelRegistry.is_pipeline_cached(
            'text-generation',
            modelId,
            PIPELINE_OPTIONS,
        );
    } catch {
        return false;
    }
}

async function load(modelId: string, restore: boolean) {
    if (state.status === 'unsupported') return;
    // A restore never downloads: a tab may hold an id from before a clear.
    if (restore) {
        const seq = loadSeq;
        const cached = await isCached(modelId);
        // A clear or a visitor's load during the check wins.
        if (!cached || seq !== loadSeq) return;
    }
    if (
        (state.status === 'loading' || state.status === 'ready') &&
        state.modelId === modelId
    )
        return;

    const seq = ++loadSeq;
    dropGenerator();
    setState({ status: 'loading', modelId, progress: 0 });
    let lastReport = 0;
    try {
        await clearing;
        const library = await import('@huggingface/transformers');
        env = library.env;
        const { pipeline } = library;
        if (seq !== loadSeq) return;
        const loaded = await pipeline('text-generation', modelId, {
            ...PIPELINE_OPTIONS,
            progress_callback(info) {
                if (info.status !== 'progress_total') return;
                if (seq !== loadSeq) return;
                const now = performance.now();
                if (now - lastReport < PROGRESS_INTERVAL_MS) return;
                lastReport = now;
                setState({
                    status: 'loading',
                    modelId,
                    progress: info.progress / 100,
                });
            },
        });
        if (seq !== loadSeq) {
            loaded.dispose().catch(logDisposeError);
            return;
        }
        generator = loaded;
        setState({ status: 'ready', modelId });
    } catch (error) {
        if (seq !== loadSeq) return;
        setState({ status: 'error', modelId, reason: String(error) });
    }
}

function clearCache() {
    if (state.status === 'unsupported') return;
    loadSeq++;
    dropGenerator();
    setState({ status: 'off' });
    // After the loads settle, so a running download cannot refill it.
    clearing = Promise.all([clearing, loads]).then(async () => {
        try {
            await caches.delete(cacheName());
        } catch (error) {
            console.error(
                new Error('Could not clear the model cache', { cause: error }),
            );
        }
    });
}

async function generate(
    message: Extract<ModelMessage, { type: 'generate' }>,
): Promise<Generated | null> {
    const current = generator;
    if (!current) return null;

    const { TextStreamer } = await import('@huggingface/transformers');
    let newTokens = 0;
    const streamer = new TextStreamer(current.tokenizer, {
        skip_prompt: true,
        callback_function: () => {},
        token_callback_function: (tokens) => {
            newTokens += tokens.length;
        },
    });
    const output = (await current(mergeTurns(message.messages), {
        // Qwen3's template thinks by default; other templates ignore it.
        tokenizer_encode_kwargs: { enable_thinking: false },
        max_new_tokens: message.maxNewTokens,
        do_sample: true,
        temperature: message.temperature,
        streamer,
    })) as TextGenerationChatOutput;
    const content = output[0]?.generated_text.at(-1)?.content;
    if (typeof content !== 'string') return null;
    return {
        text: content.trim(),
        truncated: newTokens >= message.maxNewTokens,
    };
}

function handle(message: ModelMessage) {
    switch (message.type) {
        case 'who':
            // A tab starts at `off`, so only a non-off state tells it anything,
            // and a non-boot `off` then always means a clear.
            if (state.status !== 'off') post({ type: 'state', state });
            return;
        case 'load':
            loads = Promise.all([
                loads,
                load(message.modelId, message.restore === true),
            ]).then(() => {});
            return;
        case 'clearCache':
            clearCache();
            return;
        case 'generate':
            queue = queue.then(async () => {
                let result: Generated | null = null;
                try {
                    result = await generate(message);
                } catch (error) {
                    console.error(
                        new Error('The model could not generate', {
                            cause: error,
                        }),
                    );
                }
                post({
                    type: 'generated',
                    requestId: message.requestId,
                    result,
                });
            });
            return;
    }
}

// Messages wait for the probe, in order, so an early `load` sees the result.
// Its state is the worker's first, marked `boot`: the tabs restore on it.
const probed = probe().then((probedState) => {
    state = probedState;
    post({ type: 'state', state, boot: true });
});
channel.onmessage = (event: MessageEvent<ModelMessage>) => {
    void probed.then(() => handle(event.data));
};
