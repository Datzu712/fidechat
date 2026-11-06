import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export const IS_PUBLIC = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC, true);

export const AuthenticatedUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<FastifyRequest>().user,
);
