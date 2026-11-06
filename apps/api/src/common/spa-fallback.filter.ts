import { type ArgumentsHost, Catch, type ExceptionFilter, NotFoundException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {} from '@fastify/static'; // Types reply.sendFile.

/**
 * Used only when the API serves the web build (`WEB_DIST_DIR`): a GET or HEAD outside `/api`, for a
 * path without a file extension, is a client-side route of the SPA, so it gets `index.html`. API
 * 404s and missing files (for example an old hashed asset after a redeploy) stay 404s.
 */
@Catch(NotFoundException)
export class SpaFallbackFilter implements ExceptionFilter {
    catch(exception: NotFoundException, host: ArgumentsHost) {
        const request = host.switchToHttp().getRequest<FastifyRequest>();
        const reply = host.switchToHttp().getResponse<FastifyReply>();

        const path = request.url.split('?')[0];
        const isClientRoute = !path.startsWith('/api') && !/\.[a-z0-9]+$/i.test(path);
        if ((request.method === 'GET' || request.method === 'HEAD') && isClientRoute) {
            return reply.sendFile('index.html');
        }
        return reply.status(404).send(exception.getResponse());
    }
}
