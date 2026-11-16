import { Controller, Get } from '@nestjs/common';

import { AuthenticatedUser } from '@/modules/auth/auth.decorators.js';

import { SyncService } from './sync.service.js';

@Controller({
    version: '1',
    path: '/users/@me/sync',
})
export class SyncController {
    constructor(private readonly syncService: SyncService) {}

    @Get()
    async syncCurrentUser(@AuthenticatedUser() user: IReqUser) {
        return this.syncService.getCurrentUserData(user);
    }
}
