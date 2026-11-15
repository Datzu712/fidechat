import type { MessagePayload } from '@fidechat/shared';
import { IsOptional, IsString } from 'class-validator';

export class MessageDto implements MessagePayload {
    @IsString({ groups: ['create'] })
    @IsOptional({ groups: ['update'] })
    content!: string;
}
