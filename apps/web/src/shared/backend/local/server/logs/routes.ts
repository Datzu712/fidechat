import type { LocalRequest } from '@/shared/backend/local/protocol';

// The api route each local request stands for, grouped by the Nest
// controller that would serve it. The demo-only requests get a
// `DemoController`. `:name` segments are filled from the request.

const API = '/api/v1';

const CONTROLLERS = {
    SessionController: '/auth',
    DemoController: '/demo',
    SyncController: '/users/@me/sync',
    GuildController: '/guilds',
    ChannelController: '/guilds/:guildId/channels',
    MessageController: '/guilds/:guildId/channels/:channelId/messages',
} as const;

type Controller = keyof typeof CONTROLLERS;
type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Each op's controller, method and path under that controller. */
export const ROUTES: Record<LocalRequest['op'], [Controller, Method, string]> =
    {
        me: ['SessionController', 'GET', '/me'],
        listUsers: ['DemoController', 'GET', '/users'],
        createUser: ['DemoController', 'POST', '/users'],
        reset: ['DemoController', 'POST', '/reset'],
        getBotSettings: ['DemoController', 'GET', '/bot-settings'],
        updateBotSettings: ['DemoController', 'PATCH', '/bot-settings'],
        sync: ['SyncController', 'GET', ''],
        getPublicGuilds: ['GuildController', 'GET', '/public'],
        createGuild: ['GuildController', 'POST', ''],
        createChannel: ['ChannelController', 'POST', ''],
        createMessage: ['MessageController', 'POST', ''],
        updateMessage: ['MessageController', 'PATCH', '/:messageId'],
        deleteMessage: ['MessageController', 'DELETE', '/:messageId'],
    };

export interface Route {
    method: Method;
    url: string;
    /** The status of a successful response: Nest answers POST with 201. */
    status: number;
}

export function routeOf(request: LocalRequest): Route {
    const [controller, method, path] = ROUTES[request.op];
    const params = request as unknown as Record<string, unknown>;
    const url = fullPath(controller, path).replace(
        /:(\w+)/g,
        (_, name: string) => String(params[name]),
    );
    return { method, url, status: method === 'POST' ? 201 : 200 };
}

/** What Nest maps at boot: each controller's path and its routes. */
export function routeMap(): Array<{
    controller: Controller;
    path: string;
    routes: Array<{ method: Method; path: string }>;
}> {
    const routes = Object.values(ROUTES);
    return (Object.keys(CONTROLLERS) as Controller[]).map((controller) => ({
        controller,
        path: fullPath(controller, ''),
        routes: routes
            .filter(([owner]) => owner === controller)
            .map(([, method, path]) => ({
                method,
                path: fullPath(controller, path),
            })),
    }));
}

function fullPath(controller: Controller, path: string): string {
    return `${API}${CONTROLLERS[controller]}${path}`;
}
