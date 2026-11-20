import { type PublicUser, SocketEvents } from '@fidechat/shared';
import { Injectable } from '@nestjs/common';

import type { GuildUser } from '@/infrastructure/database/schema/index.js';

import { GuildEmitter } from './guild-emitter.js';
import { UserRepository } from './user.repository.js';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly guildEmitter: GuildEmitter,
    ) {}

    /**
     * Synchronizes a user from Keycloak (KC) with the local Postgres database.
     *
     * If the user already exists in the `app_user` table (matched by `kcUser.id`), updates their `username` and `email`.
     * Otherwise, inserts a new user record with the provided `id`, `username`, and `email`.
     *
     * @param kcUser - The user object received from Keycloak, containing user identification and profile information.
     */
    async syncUsersFromKC(kcUser: IReqUser) {
        let username = kcUser.email;
        if (kcUser.given_name && kcUser.family_name) {
            username = `${kcUser.given_name} ${kcUser.family_name}`;
        } else if (kcUser.name) {
            username = kcUser.name;
        } else if (kcUser.preferred_username) {
            username = kcUser.preferred_username;
        }
        const pictureUrl = kcUser.picture || kcUser.avatarUrl || null;

        const result = await this.userRepo.upsertUser({
            id: kcUser.sub,
            username,
            email: kcUser.email,
            avatarUrl: pictureUrl,
        });

        if (result.wasAddedToGuild) {
            // Every guild member receives this, so it must not carry the email.
            const appUser: PublicUser = {
                id: kcUser.sub,
                username,
                avatarUrl: pictureUrl,
                isBot: false,
            };

            const memberMetadata: GuildUser = {
                userId: kcUser.sub,
                guildId: this.userRepo.DEFAULT_GUILD_ID,
            };

            await this.guildEmitter.emitToGuild(this.userRepo.DEFAULT_GUILD_ID, SocketEvents.MEMBER_ADD, {
                user: appUser,
                memberMetadata,
            });
        }
    }
}
