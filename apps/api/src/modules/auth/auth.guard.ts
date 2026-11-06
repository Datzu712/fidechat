import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { Logger } from '@/common/logger';
import { IS_PUBLIC } from './auth.decorators';
import { TokenVerifier } from './token-verifier.service';

/** Global guard: every route needs a valid Keycloak bearer token unless it is marked `@Public()`. */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly tokenVerifier: TokenVerifier,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
            context.getClass(),
            context.getHandler(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const token = /^Bearer (.+)$/i.exec(request.headers.authorization ?? '')?.[1];
        if (!token) throw new UnauthorizedException();

        try {
            request.user = await this.tokenVerifier.offline(token);
        } catch (error) {
            Logger.debug(`Rejected bearer token: ${String(error)}`, 'AuthGuard');
            throw new UnauthorizedException();
        }
        return true;
    }
}
