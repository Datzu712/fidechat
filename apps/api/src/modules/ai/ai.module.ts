import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module.js';
import { AIService } from './ai.service.js';
import { SpeakerSelector } from './speaker-selector.js';

@Module({
    imports: [UserModule],
    providers: [AIService, SpeakerSelector],
    exports: [AIService, SpeakerSelector],
})
export class AIModule {}
