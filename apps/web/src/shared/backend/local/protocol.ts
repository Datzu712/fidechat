import type {
    ChannelPayload,
    ConnectedUser,
    GuildPayload,
    MessagePayload,
    PublicUser,
    ServerToClientEvents,
} from '@fidechat/shared';

/** The BroadcastChannel the tabs and the server talk over. */
export const CHANNEL_NAME = 'fidechat-local';
/** The Web Lock the master tab holds while it hosts the server. */
export const MASTER_LOCK = 'fidechat-local-master';
/** A Web Lock each tab holds while it is open, so the server sees it close. */
export const tabLockName = (tabId: string) => `fidechat-local-tab-${tabId}`;
export const REQUEST_TIMEOUT_MS = 5000;

/** The allowed range of each numeric bot setting, inclusive. */
export const BOT_SETTING_LIMITS = {
    temperature: { min: 0, max: 1.5 },
    maxNewTokens: { min: 16, max: 400 },
    historyLimit: { min: 1, max: 30 },
} as const;

/** How the local bots generate; shared by every tab. Ranges in BOT_SETTING_LIMITS. */
export interface BotSettings {
    temperature: number;
    /** An integer. */
    maxNewTokens: number;
    /** How many channel messages a bot reads before replying; an integer. */
    historyLimit: number;
    /** Ids from BOT_DEFINITIONS; a disabled bot never answers. */
    disabledBotIds: string[];
}

export const DEFAULT_BOT_SETTINGS: BotSettings = {
    temperature: 0.3,
    maxNewTokens: 120,
    historyLimit: 10,
    disabledBotIds: [],
};

export type LocalRequest =
    | { op: 'me' }
    | { op: 'listUsers' }
    | { op: 'createUser'; username: string }
    | { op: 'reset' }
    | { op: 'sync' }
    | { op: 'getPublicGuilds' }
    | { op: 'getBotSettings' }
    | { op: 'updateBotSettings'; settings: Partial<BotSettings> }
    | { op: 'createGuild'; payload: GuildPayload }
    | { op: 'createChannel'; guildId: string; payload: ChannelPayload }
    | {
          op: 'createMessage';
          guildId: string;
          channelId: string;
          payload: MessagePayload;
      }
    | {
          op: 'updateMessage';
          guildId: string;
          channelId: string;
          messageId: string;
          payload: MessagePayload;
      }
    | {
          op: 'deleteMessage';
          guildId: string;
          channelId: string;
          messageId: string;
      };

/** What a tab sends to the server. */
export type TabMessage =
    | { type: 'hello'; tabId: string; userId: string | null }
    | {
          type: 'request';
          tabId: string;
          requestId: string;
          request: LocalRequest;
      }
    | { type: 'status'; tabId: string; update: unknown };

/** What the server sends to the tabs. */
export type ServerMessage =
    | { type: 'ready' }
    | { type: 'welcome'; tabId: string }
    | {
          type: 'response';
          tabId: string;
          requestId: string;
          ok: true;
          result: unknown;
      }
    | {
          type: 'response';
          tabId: string;
          requestId: string;
          ok: false;
          error: { message: string; status: number };
      }
    | ({ type: 'event' } & Emitted)
    | { type: 'reset' };

/** A socket event and the users it goes to. */
export interface Emitted {
    to: string[] | 'all';
    event: keyof ServerToClientEvents;
    payload: unknown;
}

export interface UserList {
    users: PublicUser[];
    connectedUsers: ConnectedUser[];
}
