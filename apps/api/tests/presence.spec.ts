import { BOTS } from '@/modules/ai/bots.js';
import { PresenceService } from '@/modules/gateway/presence.service.js';
import type { SocketEmitter } from '@/modules/gateway/socket-emitter.js';

describe('PresenceService bot typing', () => {
    const chayanne = BOTS[1].user.id;
    const typingOf = (presence: PresenceService) => {
        const user = presence.activeUsers.find(({ userId }) => userId === chayanne);
        return user?.isTyping ? user.typingInChannel : undefined;
    };

    function setup() {
        return new PresenceService({ broadcast: jest.fn() } as unknown as SocketEmitter);
    }

    it('keeps typing in the first channel when the second one finishes first', () => {
        const presence = setup();
        presence.startBotTyping(chayanne, 'a');
        presence.startBotTyping(chayanne, 'b');
        presence.stopBotTyping(chayanne, 'b');

        expect(typingOf(presence)).toBe('a');
    });

    it('stops typing once every channel finished', () => {
        const presence = setup();
        presence.startBotTyping(chayanne, 'a');
        presence.startBotTyping(chayanne, 'b');
        presence.stopBotTyping(chayanne, 'a');
        expect(typingOf(presence)).toBe('b');

        presence.stopBotTyping(chayanne, 'b');
        expect(typingOf(presence)).toBeUndefined();
    });

    it('ignores a stop for a channel the bot is not typing in', () => {
        const presence = setup();
        presence.startBotTyping(chayanne, 'a');
        presence.stopBotTyping(chayanne, 'b');

        expect(typingOf(presence)).toBe('a');
    });
});
