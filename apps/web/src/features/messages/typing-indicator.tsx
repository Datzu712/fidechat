import { AnimatePresence, motion } from 'framer-motion';
import { Fragment } from 'react';

import { useTypingUsers } from '@/features/presence/use-presence';

/** More typers than this collapse into "Several people". */
const MAX_NAMED_TYPERS = 5;

export function TypingIndicator({ channelId }: { channelId: string }) {
    const users = useTypingUsers(channelId);

    return (
        <AnimatePresence>
            {users.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-2 text-sm text-zinc-300 bg-zinc-800/80 border-t border-zinc-700/50"
                >
                    <div className="flex items-center gap-2">
                        <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                        </span>
                        <span>
                            {users.length > MAX_NAMED_TYPERS ? (
                                'Several people are typing...'
                            ) : (
                                <>
                                    {users.map((user, i) => (
                                        <Fragment key={user.id}>
                                            {i > 0 &&
                                                (i === users.length - 1
                                                    ? ' and '
                                                    : ', ')}
                                            <span className="font-medium text-white">
                                                {user.username}
                                            </span>
                                        </Fragment>
                                    ))}
                                    {users.length === 1
                                        ? ' is typing...'
                                        : ' are typing...'}
                                </>
                            )}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
