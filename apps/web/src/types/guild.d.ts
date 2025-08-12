export interface Guild {
    id: string;
    name: string;
    iconUrl?: string;
    isPublic: boolean;
    ownerId: string;
}

export type GuildWithMembers = Guild & {
    members: {
        userId: string;
        //role: 'ADMIN' | 'MEMBER';
    }[];
};
export type CreateGuildPayload = Omit<Guild, 'id' | 'ownerId'>;
