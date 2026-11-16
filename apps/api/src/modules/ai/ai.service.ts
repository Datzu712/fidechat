import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProviderRegistry, generateText } from 'ai';

import { UserRepository } from '../user/user.repository.js';
import { type AIBot, BOTS } from './bots.js';
import { buildPromptMessages, type ChannelHistoryEntry, cleanReply } from './prompt.js';

const DEFAULT_AI_MODEL = 'anthropic:claude-haiku-5-5';
const PROVIDER_KEYS = { anthropic: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY' } as const;
type ProviderId = keyof typeof PROVIDER_KEYS;

@Injectable()
export class AIService implements OnModuleInit {
    private readonly logger = new Logger(AIService.name);
    private readonly modelId: string;
    private readonly missingKey: string | null;
    private readonly registry;

    constructor(
        config: ConfigService<IEnvironmentVariables>,
        private readonly userRepository: UserRepository,
    ) {
        // AI_MODEL is validated at boot (environment.ts), so the provider is one of PROVIDER_KEYS.
        this.modelId = config.get('AI_MODEL') || DEFAULT_AI_MODEL;
        const provider = this.modelId.split(':')[0] as ProviderId;
        this.missingKey = config.get(PROVIDER_KEYS[provider]) ? null : PROVIDER_KEYS[provider];

        this.registry = createProviderRegistry({
            anthropic: createAnthropic({ apiKey: config.get('ANTHROPIC_API_KEY') }),
            openai: createOpenAI({ apiKey: config.get('OPENAI_API_KEY') }),
        });
    }

    get enabled(): boolean {
        return this.missingKey === null;
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

        const { text } = await generateText({
            model: this.registry.languageModel(this.modelId as `${ProviderId}:${string}`),
            instructions: bot.systemPrompt,
            messages: buildPromptMessages(bot, history),
            temperature: bot.temperature,
            maxOutputTokens: 500,
            maxRetries: 2,
            abortSignal: AbortSignal.timeout(30_000),
        });

        return cleanReply(bot, text) || null;
    }
}
