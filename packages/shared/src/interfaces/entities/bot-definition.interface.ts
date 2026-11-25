import type { AppUser } from './app-user.interface.js';

export interface BotDefinition {
    user: AppUser;
    /** Case-insensitive and without the `g` flag, so `test` stays stateless. */
    trigger: RegExp;
    /** One Spanish sentence; each app adds its own chat style. */
    persona: string;
}
