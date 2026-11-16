import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module.js';
import { AIService } from './ai.service.js';

@Module({
    imports: [UserModule],
    providers: [AIService],
    exports: [AIService],
})
export class AIModule {}
