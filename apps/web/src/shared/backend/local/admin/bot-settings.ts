import type { LocalBackend } from '@/shared/backend/local/local-backend';
import type { BotSettings } from '@/shared/backend/local/protocol';
import { request } from '@/shared/backend/local/tab/replica/server-link';

export const botSettingsAdmin: Pick<
    LocalBackend,
    'getBotSettings' | 'updateBotSettings'
> = {
    getBotSettings() {
        return request<BotSettings>({ op: 'getBotSettings' });
    },

    updateBotSettings(settings) {
        return request<BotSettings>({ op: 'updateBotSettings', settings });
    },
};
