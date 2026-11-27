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
        <div className="flex max-h-full w-full max-w-md flex-col gap-6 rounded-lg bg-background p-8 text-foreground shadow-2xl">
            <header className="text-center">
                <h1 className="text-2xl font-bold">Welcome to Fidechat</h1>
                <p className="mt-1 text-muted-foreground">
                    A demo with no server. Pick who you are.
                </p>
            </header>

            <p className="rounded-lg bg-discord-footer p-3 text-sm text-muted-foreground">
                <span className="font-bold text-green-400">Protip: </span>
                each tab is a different user. Open this page in a few tabs,
                enter as someone else in each one, and chat between them.
            </p>

            <section className="flex min-h-0 flex-col gap-2">
                <h2 className="text-xs font-bold uppercase text-muted-foreground">
                    Enter as
                </h2>
                {users.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {errorMessage(users.error)}
                    </p>
                )}
                <div className="flex min-h-0 flex-col gap-0.5 overflow-y-auto rounded-lg bg-discord-footer p-1.5">
                    {users.data?.users.map((user) => (
                        <Button
                            key={user.id}
                            variant="ghost"
                            className="h-12 justify-start gap-3 px-2 text-base"
                            onClick={() => enterAs(user.id)}
                        >
                            <span className="relative">
                                <NameAvatar
                                    name={user.username}
                                    imageUrl={user.avatarUrl}
                                    className="size-8"
                                />
                                {online.has(user.id) && (
                                    <span
                                        aria-label="online"
                                        className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-discord-footer bg-green-500"
                                    />
                                )}
                            </span>
                            <span className="flex-1 text-left">
                                {user.username}
                            </span>
                        </Button>
                    ))}
                </div>
            </section>

            <form onSubmit={handleCreate} className="flex flex-col gap-2">
                <h2 className="text-xs font-bold uppercase text-muted-foreground">
                    Create user
                </h2>
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

            <div className="flex justify-end border-t border-border pt-4">
                <Button
                    variant="link"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
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
