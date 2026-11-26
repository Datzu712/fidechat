import { describe, expect, it } from 'vitest';

import { routeOf } from '@/shared/backend/local/server/logs/routes';

describe('routeOf', () => {
    it('fills the ids into the route', () => {
        expect(
            routeOf({
                op: 'deleteMessage',
                guildId: 'g1',
                channelId: 'c1',
                messageId: 'm1',
            }),
        ).toEqual({
            method: 'DELETE',
            url: '/api/v1/guilds/g1/channels/c1/messages/m1',
            status: 200,
        });
    });

    it('answers a create with 201', () => {
        expect(routeOf({ op: 'createGuild', payload: { name: 'x' } })).toEqual({
            method: 'POST',
            url: '/api/v1/guilds',
            status: 201,
        });
    });

    it('maps the sync to its api route', () => {
        expect(routeOf({ op: 'sync' }).url).toBe('/api/v1/users/@me/sync');
    });
});
