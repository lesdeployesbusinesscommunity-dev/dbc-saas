import { Injectable, NotFoundException } from '@nestjs/common';
import { Paiement } from '../domaine/paiement';
import { PaiementRepositoryPort } from '../domaine/paiement.repository.port';

export interface RecevoirCallbackPaiementCommande {
  cleIdempotence: string;
  reussi: boolean;
}

/**
 * Point critique (cahier de conception, module Paiements) : un fournisseur Mobile
 * Money peut renvoyer la même notification plusieurs fois en cas d'instabilité
 * réseau. Si le paiement n'est plus en_attente, on répond sans retraiter — on ne
 * compte jamais deux fois la même cotisation.
 */
@Injectable()
export class RecevoirCallbackPaiementUseCase {
  constructor(private readonly paiements: PaiementRepositoryPort) {}

  async executer(commande: RecevoirCallbackPaiementCommande): Promise<Paiement> {
    const paiement = await this.paiements.trouverParCleIdempotence(commande.cleIdempotence);
    if (!paiement) {
      throw new NotFoundException('Aucun paiement ne correspond à cette clé d’idempotence');
    }

    if (paiement.statut !== 'en_attente') {
      return paiement;
    }

    if (commande.reussi) {
      paiement.marquerComplete();
    } else {
      paiement.marquerEchoue();
    }

    return this.paiements.sauvegarder(paiement);
  }
}
