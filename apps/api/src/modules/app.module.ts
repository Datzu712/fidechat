import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { validateEnv } from '@/common/utils/env.validation.js';
import { loggerParams } from '@/config/logger.js';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';

import { AIModule } from './ai/ai.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { AuthModule } from './auth/auth.module.js';
import { KeycloakSyncInterceptor } from './auth/keycloak/keycloak-sync.interceptor.js';
import { ChannelModule } from './channel/channel.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { GuildModule } from './guild/guild.module.js';
import { MessageModule } from './message/message.module.js';
import { UserModule } from './user/user.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        LoggerModule.forRoot(loggerParams),
        DatabaseModule,
        ChannelModule,
        AuthModule,
        GuildModule,
        GatewayModule,
        UserModule,
        MessageModule,
        AIModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: KeycloakSyncInterceptor,
        },
    ],
})
export class AppModule {}
