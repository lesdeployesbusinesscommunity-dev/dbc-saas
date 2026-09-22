import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionCoins } from '../domaine/transaction-coins';
import { TransactionCoinsRepositoryPort } from '../domaine/transaction-coins.repository.port';
import { CatalogueActionsCoinsRepositoryPort } from '../domaine/catalogue-actions-coins.repository.port';

export interface ReclamerGainCoinsCommande {
  membreId: string;
  codeAction: string;
  /** Identifie l'événement déclencheur (ex. "parrainage:<membreId>") — garantit l'idempotence. */
  cleIdempotence: string;
}

/**
 * Cas d'utilisation 6.1 du cahier de conception — "Réclamer un gain de
 * coins", déclenché par les événements d'autres modules. Idempotent : un même
 * événement rejoué ne crédite jamais deux fois (voir diagramme d'activité,
 * "Gain déjà réclamé ?").
 */
@Injectable()
export class ReclamerGainCoinsUseCase {
  constructor(
    private readonly transactions: TransactionCoinsRepositoryPort,
    private readonly catalogue: CatalogueActionsCoinsRepositoryPort,
  ) {}

  async executer(commande: ReclamerGainCoinsCommande): Promise<TransactionCoins> {
    const existante = await this.transactions.trouverParCleIdempotence(commande.cleIdempotence);
    if (existante) {
      return existante;
    }

    const action = await this.catalogue.trouverParCode(commande.codeAction);
    if (!action || !action.actif) {
      throw new NotFoundException('Action de gain de coins inconnue ou inactive');
    }

    const soldeAvant = await this.transactions.dernierSolde(commande.membreId);
    const resultat = TransactionCoins.creer({
      membreId: commande.membreId,
      delta: action.valeurCoins,
      soldeAvant,
      motif: action.code,
      cleIdempotence: commande.cleIdempotence,
    });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }

    return this.transactions.sauvegarder(resultat.valeur!);
  }
}
