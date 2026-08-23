import { Injectable } from '@nestjs/common';
import { SyncRepository } from './sync.repository';
import { GatewayService } from '@/modules/gateway/gateway.service';

@Injectable()
export class SyncService {
    constructor(
        private readonly syncRepo: SyncRepository,
        private readonly gateway: GatewayService,
    ) {}

    public async getCurrentUserData(currentUser: IReqUser) {
        // El repositorio ya lanza si el usuario no existe o si falla el armado.
        return this.syncRepo.getCurrentUserData(currentUser.sub);
    }
}
