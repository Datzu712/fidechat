import type { ChatMessage } from '@/shared/backend/local/model/model-protocol';

/**
 * Joins consecutive messages of the same role with a newline, since some chat
 * templates (Gemma's) require the roles to alternate.
 */
export function mergeTurns(messages: ChatMessage[]): ChatMessage[] {
    const merged: ChatMessage[] = [];
    for (const message of messages) {
        const last = merged.at(-1);
        if (last?.role === message.role)
            merged[merged.length - 1] = {
                role: last.role,
                content: `${last.content}\n${message.content}`,
            };
        else merged.push(message);
    }
    return merged;
}
