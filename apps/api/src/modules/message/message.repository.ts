import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { v4 } from 'uuid';

import { Logger } from '@/common/logger';
import { AuditService } from '@/infrastructure/database/audit/audit.service';
import { DRIZZLE, type DrizzleDB } from '@/infrastructure/database/drizzle.provider';
import { type Message, message } from '@/infrastructure/database/schema';

export type { Message };

export type MessageCreationAttributes = Omit<Message, 'id' | 'createdAt'> & { createdAt?: Date };

@Injectable()
export class MessageRepository {
    private readonly logger = new Logger(MessageRepository.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly audit: AuditService,
    ) {}

    /** Reemplaza a `PKG_MESSAGES.CREATE_MESSAGE`. */
    async createMessage({
        channelId,
        authorId,
        content,
        createdAt = new Date(),
    }: MessageCreationAttributes): Promise<{ id: string }> {
        try {
            const id = v4();

            await this.db.transaction(async (tx) => {
                const [created] = await tx
                    .insert(message)
                    .values({ id, content, authorId, channelId, createdAt })
                    .returning();

                await this.audit.record(tx, {
                    table: 'message',
                    operation: 'INSERT',
                    recordId: id,
                    after: created,
                    actorId: authorId,
                });
            });

            return { id };
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to create message', { cause: error });
        }
    }

    /**
     * Reemplaza a `PKG_MESSAGES.GET_MESSAGE`.
     *
     * El cursor de Oracle devolvia las claves en MAYUSCULAS (`CHANNEL_ID`);
     * ahora se devuelve la fila ya en camelCase.
     */
    async getMessage(id: string): Promise<Message | null> {
        try {
            const found = (await this.db.select().from(message).where(eq(message.id, id)).limit(1)).at(0);
            return found ?? null;
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to get message', { cause: error });
        }
    }

    /** Reemplaza a `PKG_MESSAGES.UPDATE_MESSAGE`. */
    async updateMessage(id: string, content: string, actorId?: string): Promise<{ success: boolean }> {
        try {
            await this.db.transaction(async (tx) => {
                const before = (await tx.select().from(message).where(eq(message.id, id)).limit(1)).at(0);

                if (!before) {
                    throw new NotFoundException('Message not found');
                }

                const [after] = await tx.update(message).set({ content }).where(eq(message.id, id)).returning();

                await this.audit.record(tx, {
                    table: 'message',
                    operation: 'UPDATE',
                    recordId: id,
                    before,
                    after,
                    actorId: actorId ?? before.authorId,
                });
            });

            return { success: true };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to update message', { cause: error });
        }
    }

    /** Reemplaza a `PKG_MESSAGES.DELETE_MESSAGE`. */
    async deleteMessage(id: string, actorId?: string): Promise<{ success: boolean }> {
        try {
            await this.db.transaction(async (tx) => {
                const deleted = (await tx.delete(message).where(eq(message.id, id)).returning()).at(0);

                if (!deleted) {
                    throw new NotFoundException('Message not found');
                }

                await this.audit.record(tx, {
                    table: 'message',
                    operation: 'DELETE',
                    recordId: id,
                    before: deleted,
                    actorId: actorId ?? deleted.authorId,
                });
            });

            return { success: true };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to delete message', { cause: error });
        }
    }
}
