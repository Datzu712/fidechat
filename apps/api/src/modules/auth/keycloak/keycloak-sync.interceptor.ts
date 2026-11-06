import { CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { UserService } from '@/modules/user/user.service';

@Injectable()
export class KeycloakSyncInterceptor implements NestInterceptor {
    constructor(private readonly userService: UserService) {}

    async intercept(context: ExecutionContext, next: CallHandler) {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        // AuthGuard already rejects protected routes without a user; @Public() routes have none.
        if (request.user) {
            // azure doesn't send a user profile photo URL bruh
            await this.userService.syncUsersFromKC(request.user);
        }

        return next.handle();
    }
}
