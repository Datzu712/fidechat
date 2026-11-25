import type {
    AppUser,
    Channel,
    Guild,
    GuildMember,
    Message,
} from '@fidechat/shared';

import type { BotSettings } from '@/shared/backend/local/protocol';

/** Bump when the shape of LocalState changes, so an older saved state is replaced. */
export const STATE_VERSION = 1;

/** Everything the local server knows, saved as one value in IndexedDB. */
export interface LocalState {
    version: number;
    defaultGuildId: string;
    users: AppUser[];
    guilds: Guild[];
    members: GuildMember[];
    channels: Channel[];
    messages: Message[];
    botSettings: BotSettings;
}
