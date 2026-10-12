import { Injectable, NotFoundException } from '@nestjs/common';
import { Antenne } from '../domaine/antenne';
import { AntenneRepositoryPort } from '../domaine/antenne.repository.port';

export interface AssignerCoordinateurCommande {
  antenneId: string;
  membreId: string | null;
}

/**
 * Cas d'utilisation "Assigner / libérer le coordinateur d'une antenne"
 * (Administrateur) — appelé depuis Admin/Gouvernance ("Réseau des Leaders
 * d'Antennes" : le "Leader Légende" reste en lecture seule, propre à
 * l'antenne elle-même ; seul le coordinateur se gère depuis la gouvernance).
 * Même mécanique qu'AssignerSiegeUseCase, pour Antenne plutôt que Siege.
 */
@Injectable()
export class AssignerCoordinateurAntenneUseCase {
  constructor(private readonly antennes: AntenneRepositoryPort) {}

  async executer(commande: AssignerCoordinateurCommande): Promise<Antenne> {
    const antenne = await this.antennes.trouverParId(commande.antenneId);
    if (!antenne) {
      throw new NotFoundException('Antenne introuvable');
    }

    antenne.coordinateurMembreId = commande.membreId;
    return this.antennes.sauvegarder(antenne);
  }
}
