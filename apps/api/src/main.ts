import './instrumentation';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import helmet from '@fastify/helmet';
import compression from '@fastify/compress';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import Fastify, { type FastifyReply } from 'fastify';

import { Logger } from 'nestjs-pino';
import { AppModule } from './modules/app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SpaFallbackFilter } from '@/common/spa-fallback.filter';

async function bootstrap() {
    // TRUST_PROXY: proxies (IPs/CIDRs) allowed to set X-Forwarded-For, so request.ip is the real client.
    const fastifyInstance = Fastify({ trustProxy: process.env.TRUST_PROXY || false });

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(fastifyInstance), {
        bufferLogs: true,
    });
    const logger = app.get(Logger);
    app.useLogger(logger);

    // The CSP also covers the SPA: avatars and guild icons are arbitrary https URLs, and the demo runs
    // over plain http, where upgrade-insecure-requests would rewrite every asset to https.
    void app.register(helmet, {
        contentSecurityPolicy: {
            directives: { imgSrc: ["'self'", 'data:', 'https:'], upgradeInsecureRequests: null },
        },
    });
    void app.register(compression);

    app.useWebSocketAdapter(new IoAdapter(app));
    app.enableVersioning({
        type: VersioningType.URI,
    });
    app.enableShutdownHooks();
    app.setGlobalPrefix('api');

    if (process.env.WEB_DIST_DIR) {
        // The production image also serves the web SPA, so the browser talks to one origin and the
        // BFF session cookie needs no CORS.
        app.useStaticAssets({
            root: process.env.WEB_DIST_DIR,
            prefix: '/',
            // Vite puts a content hash in every file name under assets/, so they never change.
            // @fastify/static 10 passes the FastifyReply here; Nest's typing still describes the old raw response.
            setHeaders: (res, filePath) => {
                if (filePath.includes('/assets/')) {
                    (res as unknown as FastifyReply).header('cache-control', 'public, max-age=31536000, immutable');
                }
            },
        });
        app.useGlobalFilters(new SpaFallbackFilter());
    }

    const config = new DocumentBuilder()
        .setTitle('Cats example')
        .setDescription('The cats API description')
        .setVersion('1.0')
        .addTag('cats')
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    await app.listen(process.env.API_PORT || 3000, '0.0.0.0');

    logger.log(`Application is running on: ${await app.getUrl()} as ${process.env.NODE_ENV} environment.`, 'Bootstrap');
}
void bootstrap();
