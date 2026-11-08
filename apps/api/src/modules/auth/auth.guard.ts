import {
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { IS_PUBLIC } from './auth.decorators';
import { TokenVerifier } from './token-verifier.service';
import { SessionService } from './session/session.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Global guard: every route needs a valid access token unless it is marked `@Public()`. The token
 * comes from the BFF session cookie (`SessionService.resolveAccessToken`); the Authorization header
 * is only read outside production.
 */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly tokenVerifier: TokenVerifier,
        private readonly sessions: SessionService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // CSRF: writes must come from the web app, on public routes (logout) too.
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        if (!SAFE_METHODS.has(request.method) && !this.sessions.isAllowedOrigin(request.headers.origin)) {
            throw new ForbiddenException('Origin not allowed');
        }

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
            context.getClass(),
            context.getHandler(),
        ]);
        if (isPublic) return true;

        const token = await this.sessions.resolveAccessToken(
            request.headers.cookie,
            () => /^Bearer (.+)$/i.exec(request.headers.authorization ?? '')?.[1],
        );
        if (!token) throw new UnauthorizedException();

        // An invalid token is a 401 and Keycloak being down a 503; both come from TokenVerifier as is.
        request.user = await this.tokenVerifier.offline(token);
        return true;
    }
}
