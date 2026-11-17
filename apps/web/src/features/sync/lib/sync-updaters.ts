import type {
    AppUser,
    Channel,
    ConnectedUser,
    GuildMember,
    GuildWithMembers,
    Message,
    SyncPayload,
} from '@fidechat/shared';

/*
 * Pure, immutable updates of the synced state, one per socket event. Each
 * returns `data` unchanged when its target is not in the state.
 */

export function addGuild(
    data: SyncPayload,
    guild: GuildWithMembers,
): SyncPayload {
    if (data.guilds.some((g) => g.id === guild.id)) return data;
    return { ...data, guilds: [...data.guilds, guild] };
}

export function addChannel(data: SyncPayload, channel: Channel): SyncPayload {
    if (data.channels.some((c) => c.id === channel.id)) return data;
    return {
        ...data,
        channels: [...data.channels, { ...channel, messages: [] }],
    };
}

export function addMember(
    data: SyncPayload,
    {
        user,
        memberMetadata,
    }: { user: Omit<AppUser, 'email'>; memberMetadata: GuildMember },
): SyncPayload {
    const hasUser = data.users.some((u) => u.id === user.id);
    return {
        ...data,
        users: hasUser ? data.users : [...data.users, user],
        guilds: data.guilds.map((guild) =>
            guild.id === memberMetadata.guildId &&
            !guild.members.some((m) => m.userId === memberMetadata.userId)
                ? {
                      ...guild,
                      members: [
                          ...guild.members,
                          { userId: memberMetadata.userId },
                      ],
                  }
                : guild,
        ),
    };
}

export function addMessage(data: SyncPayload, message: Message): SyncPayload {
    if (!data.channels.some((c) => c.id === message.channelId)) return data;
    return {
        ...data,
        channels: data.channels.map((channel) =>
            channel.id === message.channelId &&
            !channel.messages.some((m) => m.id === message.id)
                ? { ...channel, messages: [...channel.messages, message] }
                : channel,
        ),
    };
}

export function updateMessage(
    data: SyncPayload,
    { id, content }: Pick<Message, 'id' | 'content'>,
): SyncPayload {
    const target = data.channels.find((c) =>
        c.messages.some((m) => m.id === id),
    );
    if (!target) return data;
    return {
        ...data,
        channels: data.channels.map((channel) =>
            channel === target
                ? {
                      ...channel,
                      messages: channel.messages.map((m) =>
                          m.id === id ? { ...m, content } : m,
                      ),
                  }
                : channel,
        ),
    };
}

export function removeMessage(
    data: SyncPayload,
    { id, channelId }: Pick<Message, 'id' | 'channelId'>,
): SyncPayload {
    if (!data.channels.some((c) => c.id === channelId)) return data;
    return {
        ...data,
        channels: data.channels.map((channel) =>
            channel.id === channelId
                ? {
                      ...channel,
                      messages: channel.messages.filter((m) => m.id !== id),
                  }
                : channel,
        ),
    };
}

export function setConnectedUsers(
    data: SyncPayload,
    connectedUsers: ConnectedUser[],
): SyncPayload {
    return { ...data, connectedUsers };
}
