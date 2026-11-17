import { Hash, Lock, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { CreateChannelModal } from '@/features/channels/create-channel-modal';
import { useGuildChannels } from '@/features/channels/use-channels';
import { useGuild } from '@/features/guilds/use-guilds';
import { useCurrentUser } from '@/features/members/use-users';
import { Button } from '@/shared/ui/button';

/** How many channel shortcuts the welcome view shows. */
const MAX_SHORTCUTS = 3;

/** A guild with no channel selected: a welcome, or a prompt to create one. */
export function ServerPage() {
    const navigate = useNavigate();
    const params = useParams() as { id: string };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const currentUser = useCurrentUser();
    const guild = useGuild(params.id);
    const channels = useGuildChannels(params.id);

    const isOwner = guild?.ownerId === currentUser?.id;
    const hasChannels = channels.length > 0;

    return (
        <div className="message-area flex flex-col h-full flex-1 min-w-0">
            <div className="flex items-center px-4 py-3 border-b border-zinc-700">
                <h1 className="font-semibold text-white">{guild?.name}</h1>
                {guild?.description && (
                    <div className="ml-4 text-sm text-zinc-400 truncate">
                        {guild.description}
                    </div>
                )}
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                        {guild?.iconUrl ? (
                            <img
                                src={guild.iconUrl}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Hash className="h-8 w-8 text-zinc-400" />
                        )}
                    </div>

                    <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                        Welcome to {guild?.name}!
                    </h2>

                    {hasChannels ? (
                        <>
                            <p className="text-zinc-400 mb-6">
                                Pick a channel to start chatting.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {channels
                                    .slice(0, MAX_SHORTCUTS)
                                    .map((channel) => (
                                        <Button
                                            key={channel.id}
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                navigate(
                                                    `/servers/${params.id}/channels/${channel.id}`,
                                                )
                                            }
                                        >
                                            <Hash className="h-4 w-4" />
                                            {channel.name}
                                        </Button>
                                    ))}
                                {channels.length > MAX_SHORTCUTS && (
                                    <span className="px-3 py-1 text-sm text-zinc-400">
                                        +{channels.length - MAX_SHORTCUTS} more
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-zinc-400 mb-6">
                                This server has no channels yet. Channels are
                                where members talk.
                            </p>
                            {isOwner ? (
                                <Button onClick={() => setIsModalOpen(true)}>
                                    <PlusCircle className="h-4 w-4" />
                                    Create a channel
                                </Button>
                            ) : (
                                <p className="inline-flex items-center gap-2 text-sm text-zinc-500">
                                    <Lock className="h-4 w-4" />
                                    Only the owner can create channels.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            <CreateChannelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                serverId={params.id}
            />
        </div>
    );
}
