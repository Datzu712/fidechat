export interface Guild {
    id: string;
    name: string;
    iconUrl?: string;
    isPublic: boolean;
    ownerId: string;
}

export type CreateGuildPayload = Omit<Guild, 'id' | 'ownerId'>;
