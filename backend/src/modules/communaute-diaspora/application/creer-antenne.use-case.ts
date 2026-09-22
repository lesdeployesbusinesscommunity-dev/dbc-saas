import { Injectable } from '@nestjs/common';
import { Antenne, StatutAntenne } from '../domaine/antenne';
import { AntenneRepositoryPort } from '../domaine/antenne.repository.port';

export interface CreerAntenneCommande {
  zoneId: number;
  ville: string;
  statut?: StatutAntenne;
}

/** Cas d'utilisation 9.1 — "Créer une antenne" (Administrateur). */
@Injectable()
export class CreerAntenneUseCase {
  constructor(private readonly antennes: AntenneRepositoryPort) {}

  async executer(commande: CreerAntenneCommande): Promise<Antenne> {
    return this.antennes.sauvegarder(Antenne.creer(commande));
  }
}
