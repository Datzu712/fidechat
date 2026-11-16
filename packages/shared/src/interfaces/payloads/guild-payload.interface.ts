/** Body of `POST /guilds` and `PATCH /guilds/:id`. The owner comes from the token. */
export interface GuildPayload {
    name: string;
    iconUrl?: string;
    isPublic?: boolean;
}
