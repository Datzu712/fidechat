import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProviderRegistry, generateText, Output } from 'ai';

import { UserRepository } from '../user/user.repository.js';
import { type AIBot, BOTS } from './bots.js';
import { buildPromptMessages, type ChannelHistoryEntry, cleanReply, trimToLastSentence } from './prompt.js';
import { buildRouterPrompt, type PlannedSpeaker, ROUTER_INSTRUCTIONS, ROUTER_SCHEMA } from './router.js';

// The SDK prints warnings with console.warn, outside pino; `reply` logs them through the Nest logger instead.
globalThis.AI_SDK_LOG_WARNINGS = false;

const DEFAULT_AI_MODEL = 'anthropic:claude-haiku-5-5';
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434/v1';
/** The env var holding each provider's API key; Ollama runs locally and needs none. */
const PROVIDER_KEYS = { anthropic: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY', ollama: null } as const;
type ProviderId = keyof typeof PROVIDER_KEYS;

@Injectable()
export class AIService implements OnModuleInit {
    private readonly logger = new Logger(AIService.name);
    private readonly modelId: string;
    private readonly missingKey: string | null;
    private readonly routerOn: boolean;
    private readonly registry;

    constructor(
        config: ConfigService<IEnvironmentVariables>,
        private readonly userRepository: UserRepository,
    ) {
        // AI_MODEL is validated at boot (environment.ts), so the provider is one of PROVIDER_KEYS.
        this.modelId = config.get('AI_MODEL') || DEFAULT_AI_MODEL;
        this.routerOn = config.get('AI_ROUTER') !== 'off';
        const provider = this.modelId.split(':')[0] as ProviderId;
        const keyName = PROVIDER_KEYS[provider];
        this.missingKey = keyName && !config.get(keyName) ? keyName : null;

        this.registry = createProviderRegistry({
            anthropic: createAnthropic({ apiKey: config.get('ANTHROPIC_API_KEY') }),
            openai: createOpenAI({ apiKey: config.get('OPENAI_API_KEY') }),
            // Ollama serves an OpenAI-compatible API under /v1.
            ollama: createOpenAICompatible({
                name: 'ollama',
                baseURL: config.get('OLLAMA_BASE_URL') || DEFAULT_OLLAMA_BASE_URL,
            }),
        });
    }

    get enabled(): boolean {
        return this.missingKey === null;
    }

    get routerEnabled(): boolean {
        return this.enabled && this.routerOn;
    }

    async onModuleInit() {
        for (const { user } of BOTS) {
            try {
                await this.userRepository.upsertUser(user);
            } catch (error) {
                this.logger.error(new Error(`Error creating/updating AI bot ${user.username}`, { cause: error }));
            }
        }

        if (this.enabled) {
            this.logger.log(`AI bots using ${this.modelId}`);
        } else {
            this.logger.warn(`AI bots disabled: ${this.missingKey} is not set`);
        }
    }

    /** Returns `null` when the bots are disabled or the model produced no text; throws on provider errors. */
    async reply(bot: AIBot, history: ChannelHistoryEntry[]): Promise<string | null> {
        if (!this.enabled) return null;

        const { text, finishReason, warnings } = await generateText({
            model: this.registry.languageModel(this.modelId as `${ProviderId}:${string}`),
            instructions: bot.systemPrompt,
            messages: buildPromptMessages(bot, history),
            temperature: bot.temperature,
            // Recent Claude models think by default, and thinking counts against maxOutputTokens.
            reasoning: 'none',
            maxOutputTokens: 150,
            maxRetries: 2,
            abortSignal: AbortSignal.timeout(30_000),
        });

        for (const warning of warnings ?? []) {
            this.logger.debug(`AI SDK warning: ${JSON.stringify(warning)}`);
        }

        let reply = cleanReply(bot, text);
        if (!reply || finishReason === 'length') {
            this.logger.warn(`${bot.user.username} reply finished with ${finishReason} (${reply.length} chars)`);
        }
        // A reply cut off by maxOutputTokens would end mid-sentence.
        if (finishReason === 'length') reply = trimToLastSentence(reply);
        return reply || null;
    }

    /** Asks the model which bots should speak. Returns `null` when the router is off or on any error. */
    async route(
        history: ChannelHistoryEntry[],
        newIds: ReadonlySet<string>,
        exclude: readonly AIBot[] = [],
    ): Promise<PlannedSpeaker[] | null> {
        if (!this.routerEnabled) return null;

        try {
            const { output, usage, warnings } = await generateText({
                model: this.registry.languageModel(this.modelId as `${ProviderId}:${string}`),
                instructions: ROUTER_INSTRUCTIONS,
                prompt: buildRouterPrompt(history, newIds, exclude),
                output: Output.object({ schema: ROUTER_SCHEMA }),
                reasoning: 'none',
                maxOutputTokens: 300,
                maxRetries: 2,
                abortSignal: AbortSignal.timeout(30_000),
            });

            for (const warning of warnings ?? []) {
                this.logger.debug(`AI SDK warning: ${JSON.stringify(warning)}`);
            }
            this.logger.debug(`Router used ${usage.inputTokens} input and ${usage.outputTokens} output tokens`);

            const planned: PlannedSpeaker[] = [];
            for (const { bot: username, kind } of output.speakers) {
                const bot = BOTS.find((candidate) => candidate.user.username === username);
                if (bot && !exclude.includes(bot)) planned.push({ bot, kind });
            }
            return planned;
        } catch (error) {
            this.logger.warn(new Error('AI router failed', { cause: error }));
            return null;
        }
    }
}
