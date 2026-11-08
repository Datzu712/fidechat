import { Module } from '@nestjs/common';
import { AICommandService } from './ai-command.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
    imports: [UserModule],
    providers: [AICommandService],
    exports: [AICommandService],
})
export class AIModule {}
