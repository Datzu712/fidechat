export interface Guild {
    id: string;
    name: string;
    iconUrl: string | null;
    isPublic: boolean;
    ownerId: string;
    description: string | null;
}

export interface GuildMember {
    guildId: string;
    userId: string;
}

export interface GuildWithMembers extends Guild {
    members: Array<Pick<GuildMember, 'userId'>>;
}
