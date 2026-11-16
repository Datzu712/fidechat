import { Injectable } from '@nestjs/common';
import { SyncRepository } from './sync.repository.js';

@Injectable()
export class SyncService {
    constructor(private readonly syncRepo: SyncRepository) {}

    public async getCurrentUserData(currentUser: IReqUser) {
        // El repositorio ya lanza si el usuario no existe o si falla el armado.
        return this.syncRepo.getCurrentUserData(currentUser.sub);
    }
}
