import type { AppUser } from '@fidechat/shared';

import type { Backend } from '@/shared/backend/backend';
import { botSettingsAdmin } from '@/shared/backend/local/admin/bot-settings';
import { modelAdmin } from '@/shared/backend/local/admin/model';
import { resetAdmin } from '@/shared/backend/local/admin/reset';
import { channelBackend } from '@/shared/backend/local/api/channels';
import { guildBackend } from '@/shared/backend/local/api/guilds';
import { messageBackend } from '@/shared/backend/local/api/messages';
import { realtimeBackend } from '@/shared/backend/local/api/realtime';
import { sessionBackend } from '@/shared/backend/local/api/session';
import type { ModelState } from '@/shared/backend/local/model/model-protocol';
import type { BotSettings, UserList } from '@/shared/backend/local/protocol';
import { masterStatus } from '@/shared/backend/local/tab/master';

export interface LocalBackend extends Backend {
    listUsers(): Promise<UserList>;
    createUser(username: string): Promise<AppUser>;
    /** Stores the user for this tab. The caller then loads `/servers`. */
    enterAs(userId: string): void;
    resetDemo(): Promise<void>;
    isMaster(): boolean;
    onMasterChange(listener: (isMaster: boolean) => void): () => void;
    getModelState(): ModelState;
    onModelStateChange(listener: (state: ModelState) => void): () => void;
    loadModel(modelId: string): void;
    /** Drops the model and deletes its downloaded files, in the master. */
    clearModelCache(): void;
    getBotSettings(): Promise<BotSettings>;
    updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings>;
}

/** The local backend: each tab is a user, served by the master tab's worker. */
export const localBackend: LocalBackend = {
    ...sessionBackend,
    ...realtimeBackend,
    ...guildBackend,
    ...channelBackend,
    ...messageBackend,
    ...masterStatus,
    ...resetAdmin,
    ...modelAdmin,
    ...botSettingsAdmin,
};
