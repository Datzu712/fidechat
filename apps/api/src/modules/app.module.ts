import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { validateEnv } from '@/common/utils/env.validation';
import { loggerParams } from '@/config/logger';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { ChannelModule } from './channel/channel.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { KeycloakSyncInterceptor } from './auth/keycloak/keycloak-sync.interceptor';
import { UserModule } from './user/user.module';
import { GuildModule } from './guild/guild.module';
import { GatewayModule } from './gateway/gateway.module';
import { MessageModule } from './message/message.module';
import { AIModule } from './ai/ai.module';

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
