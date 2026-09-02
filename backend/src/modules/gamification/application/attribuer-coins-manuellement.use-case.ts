import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TransactionCoins } from '../domaine/transaction-coins';
import { TransactionCoinsRepositoryPort } from '../domaine/transaction-coins.repository.port';

export interface AttribuerCoinsCommande {
  membreId: string;
  delta: number;
  motif: string;
}

/** Cas d'utilisation 6.3 — "Attribuer des coins manuellement" (Administrateur), motif obligatoire. */
@Injectable()
export class AttribuerCoinsManuellementUseCase {
  constructor(private readonly transactions: TransactionCoinsRepositoryPort) {}

  async executer(commande: AttribuerCoinsCommande): Promise<TransactionCoins> {
    const soldeAvant = await this.transactions.dernierSolde(commande.membreId);
    const resultat = TransactionCoins.creer({
      membreId: commande.membreId,
      delta: commande.delta,
      soldeAvant,
      motif: commande.motif,
      cleIdempotence: `manuel:${randomUUID()}`,
    });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }

    return this.transactions.sauvegarder(resultat.valeur!);
  }
}
