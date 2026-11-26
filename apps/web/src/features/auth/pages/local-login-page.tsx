import type { AppUser, ConnectedUser } from '@fidechat/shared';
import { SocketEvents } from '@fidechat/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { errorMessage } from '@/shared/api/error-message';
import type { BackendError } from '@/shared/backend/backend';
import { localBackend } from '@/shared/backend/local/local-backend';
import type { UserList } from '@/shared/backend/local/protocol';
import { NameAvatar } from '@/shared/components/name-avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const USERS_KEY = ['local-users'];

function enterAs(userId: string) {
    localBackend.enterAs(userId);
    window.location.assign('/servers');
}

/**
 * The local build's login: Vite aliases `@/features/auth/pages/login-page` to
 * this page in `--mode backendless`. Each tab picks or creates its user.
 */
export function LoginPage() {
    const { status } = useAuth();
    const queryClient = useQueryClient();
    const [username, setUsername] = useState('');

    const users = useQuery<UserList, BackendError>({
        queryKey: USERS_KEY,
        queryFn: () => localBackend.listUsers(),
    });

    useEffect(() => {
        localBackend.connect();
        return localBackend.on(
            SocketEvents.USER_STATUS_UPDATE,
            (connectedUsers: ConnectedUser[]) => {
                queryClient.setQueryData<UserList>(
                    USERS_KEY,
                    (current) => current && { ...current, connectedUsers },
                );
            },
        );
    }, [queryClient]);

    const create = useMutation<AppUser, BackendError, string>({
        mutationFn: (name) => localBackend.createUser(name),
        onSuccess: (user) => enterAs(user.id),
    });

    const reset = useMutation<void, BackendError>({
        mutationFn: () => localBackend.resetDemo(),
    });

    if (status === 'authenticated') return <Navigate to="/servers" replace />;

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        create.mutate(username.trim());
    };

    const online = new Set(
        users.data?.connectedUsers
            .filter((user) => user.status !== 'offline')
            .map((user) => user.userId),
    );

    return (
        <div className="flex w-full max-w-sm flex-col gap-6 rounded-lg bg-discord-sidebar p-6 text-foreground">
            <h1 className="text-xl font-semibold">
                Fidechat · demo with no server
            </h1>

            <section className="flex flex-col gap-2">
                <h2 className="text-sm text-muted-foreground">Enter as:</h2>
                {users.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {errorMessage(users.error)}
                    </p>
                )}
                {users.data?.users.map((user) => (
                    <Button
                        key={user.id}
                        variant="ghost"
                        className="justify-start bg-discord-chat"
                        onClick={() => enterAs(user.id)}
                    >
                        <NameAvatar
                            name={user.username}
                            imageUrl={user.avatarUrl}
                            className="size-6"
                        />
                        <span className="flex-1 text-left">
                            {user.username}
                        </span>
                        {online.has(user.id) && (
                            <span
                                aria-label="online"
                                className="size-2 rounded-full bg-green-500"
                            />
                        )}
                    </Button>
                ))}
            </section>

            <form onSubmit={handleCreate} className="flex flex-col gap-2">
                <h2 className="text-sm text-muted-foreground">Create user</h2>
                <div className="flex gap-2">
                    <Input
                        aria-label="Name"
                        placeholder="Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <Button
                        type="submit"
                        disabled={!username.trim() || create.isPending}
                    >
                        Create
                    </Button>
                </div>
                {create.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {errorMessage(create.error)}
                    </p>
                )}
            </form>

            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>Open another tab to enter as someone else.</span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={reset.isPending}
                    onClick={() => reset.mutate()}
                >
                    Reset demo
                </Button>
            </div>
            {reset.isError && (
                <p role="alert" className="text-sm text-destructive">
                    {errorMessage(reset.error)}
                </p>
            )}
        </div>
    );
}
