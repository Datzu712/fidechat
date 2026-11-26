import type { Backend } from '@/shared/backend/backend';
import { channelBackend } from '@/shared/backend/http/channels';
import { guildBackend } from '@/shared/backend/http/guilds';
import { messageBackend } from '@/shared/backend/http/messages';
import { realtimeBackend } from '@/shared/backend/http/realtime';
import { sessionBackend } from '@/shared/backend/http/session';

/** The real backend: the API over HTTP (the BFF session cookie) and Socket.IO. */
export const httpBackend: Backend = {
    ...sessionBackend,
    ...realtimeBackend,
    ...guildBackend,
    ...channelBackend,
    ...messageBackend,
};
