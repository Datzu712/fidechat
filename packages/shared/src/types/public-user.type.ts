import type { AppUser } from '../interfaces/entities/app-user.interface.js';

/** A user as other users see them: never with their email. */
export type PublicUser = Omit<AppUser, 'email'>;
