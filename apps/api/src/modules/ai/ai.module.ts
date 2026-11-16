import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module.js';
import { AICommandService } from './ai-command.service.js';

@Module({
    imports: [UserModule],
    providers: [AICommandService],
    exports: [AICommandService],
})
export class AIModule {}
