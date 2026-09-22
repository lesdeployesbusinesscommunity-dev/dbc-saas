import { BadRequestException, Injectable } from '@nestjs/common';
import { Paiement } from '../domaine/paiement';
import { PaiementRepositoryPort } from '../domaine/paiement.repository.port';
import { FournisseurPaiementPort } from '../domaine/fournisseur-paiement.port';

export interface InitierPaiementCommande {
  montant: number;
  objet: string;
  telephone: string;
  cleIdempotence: string;
}

/**
 * Orchestration pure : aucune logique métier ici, elle vit dans l'entité.
 * La clé d'idempotence est fournie par l'appelant (ex. le module Tontine, pour
 * garantir qu'une même cotisation ne déclenche jamais deux paiements) — voir
 * RecevoirCallbackPaiementUseCase pour l'autre moitié de la garantie d'idempotence,
 * côté retour du fournisseur.
 */
@Injectable()
export class InitierPaiementUseCase {
  constructor(
    private readonly paiements: PaiementRepositoryPort,
    private readonly fournisseur: FournisseurPaiementPort,
  ) {}

  async executer(commande: InitierPaiementCommande): Promise<Paiement> {
    const existant = await this.paiements.trouverParCleIdempotence(commande.cleIdempotence);
    if (existant) {
      return existant;
    }

    const resultat = Paiement.creer(commande);
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const paiement = resultat.valeur!;

    await this.fournisseur.initier({
      montant: commande.montant,
      objet: commande.objet,
      telephone: commande.telephone,
      cleIdempotence: commande.cleIdempotence,
    });

    return this.paiements.sauvegarder(paiement);
  }
}
