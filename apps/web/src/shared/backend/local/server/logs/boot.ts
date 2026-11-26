import type { Logger } from '@/shared/backend/local/server/logs/logger';
import { routeMap } from '@/shared/backend/local/server/logs/routes';

// What Nest prints while the api starts, then once it listens.

/** The modules the api's InstanceLoader reports at boot. */
const MODULES = [
    'AppModule',
    'DatabaseModule',
    'AuthModule',
    'GatewayModule',
    'UserModule',
    'GuildModule',
    'ChannelModule',
    'MessageModule',
    'AIModule',
];

/** Logged before the state loads. */
export function logBoot(logger: Logger): void {
    logger.context('NestFactory').info('Starting Nest application...');

    const loader = logger.context('InstanceLoader');
    for (const name of MODULES) loader.info(`${name} dependencies initialized`);

    logger.context('SocketGateway').info('Initializing WebSocket Gateway...');

    const resolver = logger.context('RoutesResolver');
    const explorer = logger.context('RouterExplorer');
    for (const { controller, path, routes } of routeMap()) {
        resolver.info(`${controller} {${path}}:`);
        for (const route of routes) {
            explorer.info(`Mapped {${route.path}, ${route.method}} route`);
        }
    }
}

/** Logged once the server is ready. */
export function logStarted(logger: Logger, origin: string): void {
    logger
        .context('NestApplication')
        .info('Nest application successfully started');
    logger
        .context('Bootstrap')
        .info(
            `Application is running on: ${origin} as backendless environment.`,
        );
}
