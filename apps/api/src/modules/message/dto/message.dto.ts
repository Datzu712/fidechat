import type { MessagePayload } from '@fidechat/shared';
import { IsString } from 'class-validator';

export class MessageDto implements MessagePayload {
    @IsString({ groups: ['create', 'update'] })
    content!: string;
}
