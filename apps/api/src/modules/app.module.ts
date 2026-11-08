import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { validateEnv } from '@/common/utils/env.validation.js';
import { loggerParams } from '@/config/logger.js';
import { DatabaseModule } from '@/infrastructure/database/database.module.js';
import { ChannelModule } from './channel/channel.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { KeycloakSyncInterceptor } from './auth/keycloak/keycloak-sync.interceptor.js';
import { UserModule } from './user/user.module.js';
import { GuildModule } from './guild/guild.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { MessageModule } from './message/message.module.js';
import { AIModule } from './ai/ai.module.js';

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
