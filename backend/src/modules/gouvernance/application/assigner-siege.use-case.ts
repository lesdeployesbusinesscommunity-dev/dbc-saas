import { Injectable, NotFoundException } from '@nestjs/common';
import { Siege } from '../domaine/siege';
import { SiegeRepositoryPort } from '../domaine/siege.repository.port';

export interface AssignerSiegeCommande {
  siegeId: string;
  membreId: string | null;
}

/** Cas d'utilisation "Assigner / libérer un siège de gouvernance" (Administrateur). */
@Injectable()
export class AssignerSiegeUseCase {
  constructor(private readonly sieges: SiegeRepositoryPort) {}

  async executer(commande: AssignerSiegeCommande): Promise<Siege> {
    const siege = await this.sieges.trouverParId(commande.siegeId);
    if (!siege) {
      throw new NotFoundException('Siège introuvable');
    }

    if (commande.membreId) {
      siege.assigner(commande.membreId);
    } else {
      siege.liberer();
    }

    return this.sieges.sauvegarder(siege);
  }
}
