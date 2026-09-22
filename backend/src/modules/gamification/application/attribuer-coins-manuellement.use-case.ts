import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TransactionCoins } from '../domaine/transaction-coins';
import { TransactionCoinsRepositoryPort } from '../domaine/transaction-coins.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface AttribuerCoinsCommande {
  membreId: string;
  delta: number;
  motif: string;
}

/** Cas d'utilisation 6.3 — "Attribuer des coins manuellement" (Administrateur), motif obligatoire. */
@Injectable()
export class AttribuerCoinsManuellementUseCase {
  constructor(
    private readonly transactions: TransactionCoinsRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

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

    const transaction = await this.transactions.sauvegarder(resultat.valeur!);

    await this.enregistrerAudit.executer({
      action: 'coins_attribues_manuellement',
      typeEntite: 'TransactionCoins',
      acteurId: null,
      metadonnees: { membreId: commande.membreId, delta: commande.delta, motif: commande.motif },
    });

    return transaction;
  }
}
