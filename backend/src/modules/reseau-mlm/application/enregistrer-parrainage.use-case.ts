import { Injectable } from '@nestjs/common';
import { ParrainageMlm } from '../domaine/parrainage-mlm';
import { ParrainageMlmRepositoryPort } from '../domaine/parrainage-mlm.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { ReclamerGainCoinsUseCase } from '../../gamification/application/reclamer-gain-coins.use-case';

export interface EnregistrerParrainageCommande {
  membreId: string;
  matriculeParrain?: string;
}

/** Niveau 3 = Bâtisseur Pro (voir AdhesionBootstrap, niveaux semés dans l'ordre). */
const NIVEAU_MINIMUM_POUR_GAIN_PARRAINAGE = 3;

/**
 * Cas d'utilisation 5.1 du cahier de conception — "Parrainer un nouveau
 * membre", déclenché lors de l'inscription (voir ValiderDemandeInscriptionUseCase,
 * module Identité & accès). Un code parrain inconnu ou absent place le membre
 * comme racine de son propre arbre plutôt que de bloquer l'onboarding.
 *
 * Déclenche aussi le gain de coins "parrainage_membre_actif_niv3plus" (cahier
 * des charges §5.3 : +100 coins, Niv.3+) si le parrain est éligible.
 */
@Injectable()
export class EnregistrerParrainageUseCase {
  constructor(
    private readonly parrainages: ParrainageMlmRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly reclamerGainCoins: ReclamerGainCoinsUseCase,
  ) {}

  async executer(commande: EnregistrerParrainageCommande): Promise<ParrainageMlm> {
    const parrain = commande.matriculeParrain
      ? await this.membres.trouverParMatricule(commande.matriculeParrain)
      : null;
    const positionParrain = parrain ? await this.parrainages.trouverParMembreId(parrain.id) : null;

    const parrainage = positionParrain
      ? ParrainageMlm.creerSousParrain(commande.membreId, positionParrain)
      : ParrainageMlm.creerRacine(commande.membreId);

    const parrainageSauvegarde = await this.parrainages.sauvegarder(parrainage);

    if (parrain && parrain.niveauActuelId >= NIVEAU_MINIMUM_POUR_GAIN_PARRAINAGE) {
      await this.reclamerGainCoins.executer({
        membreId: parrain.id,
        codeAction: 'parrainage_membre_actif_niv3plus',
        cleIdempotence: `parrainage:${commande.membreId}`,
      });
    }

    return parrainageSauvegarde;
  }
}
