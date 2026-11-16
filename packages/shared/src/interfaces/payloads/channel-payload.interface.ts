/** Body of `POST /guilds/:guildId/channels`. The guild comes from the URL. */
export interface ChannelPayload {
    name: string;
    description?: string;
    position?: number;
}
