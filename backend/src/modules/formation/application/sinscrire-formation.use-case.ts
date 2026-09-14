import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Inscription } from '../domaine/inscription';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';

export interface SInscrireFormationCommande {
  membreId: string;
  formationId: string;
}

/**
 * Cas d'utilisation 7.1 du cahier de conception — "S'inscrire à une
 * formation". Le contrôle de niveau requis n'est pas dans le cahier de
 * conception mais est imposé par le Cahier des Charges §5.1 : "Accès
 * conditionnel au niveau DBC".
 */
@Injectable()
export class SInscrireFormationUseCase {
  constructor(
    private readonly formations: FormationRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly membres: MembreRepositoryPort,
  ) {}

  async executer(commande: SInscrireFormationCommande): Promise<Inscription> {
    const formation = await this.formations.trouverParId(commande.formationId);
    if (!formation) {
      throw new NotFoundException('Formation introuvable');
    }

    const membre = await this.membres.trouverParId(commande.membreId);
    if (!membre) {
      throw new NotFoundException('Membre introuvable');
    }
    // Les niveaux sont semés dans l'ordre (id croissant = rang croissant) — voir AdhesionBootstrap.
    if (membre.niveauActuelId < formation.niveauRequisId) {
      throw new BadRequestException('Niveau DBC insuffisant pour cette formation');
    }

    const existante = await this.inscriptions.trouverParMembreEtFormation(commande.membreId, commande.formationId);
    if (existante) {
      throw new ConflictException('Déjà inscrit à cette formation');
    }

    const inscription = Inscription.creer({ membreId: commande.membreId, formationId: commande.formationId });
    return this.inscriptions.sauvegarder(inscription);
  }
}
