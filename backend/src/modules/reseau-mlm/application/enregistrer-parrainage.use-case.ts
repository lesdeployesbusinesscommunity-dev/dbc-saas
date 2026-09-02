import { Injectable } from '@nestjs/common';
import { ParrainageMlm } from '../domaine/parrainage-mlm';
import { ParrainageMlmRepositoryPort } from '../domaine/parrainage-mlm.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';

export interface EnregistrerParrainageCommande {
  membreId: string;
  matriculeParrain?: string;
}

/**
 * Cas d'utilisation 5.1 du cahier de conception — "Parrainer un nouveau
 * membre", déclenché lors de l'inscription (voir ValiderDemandeInscriptionUseCase,
 * module Identité & accès). Un code parrain inconnu ou absent place le membre
 * comme racine de son propre arbre plutôt que de bloquer l'onboarding.
 */
@Injectable()
export class EnregistrerParrainageUseCase {
  constructor(
    private readonly parrainages: ParrainageMlmRepositoryPort,
    private readonly membres: MembreRepositoryPort,
  ) {}

  async executer(commande: EnregistrerParrainageCommande): Promise<ParrainageMlm> {
    const positionParrain = commande.matriculeParrain
      ? await this.trouverPositionParrain(commande.matriculeParrain)
      : null;

    const parrainage = positionParrain
      ? ParrainageMlm.creerSousParrain(commande.membreId, positionParrain)
      : ParrainageMlm.creerRacine(commande.membreId);

    return this.parrainages.sauvegarder(parrainage);
  }

  private async trouverPositionParrain(matricule: string): Promise<ParrainageMlm | null> {
    const parrain = await this.membres.trouverParMatricule(matricule);
    if (!parrain) {
      return null;
    }
    return this.parrainages.trouverParMembreId(parrain.id);
  }
}
