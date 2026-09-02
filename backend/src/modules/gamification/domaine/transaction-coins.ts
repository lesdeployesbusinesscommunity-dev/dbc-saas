/**
 * Entité de domaine pure. Reflète "TransactionCoins" du cahier de conception,
 * module 6 — registre en ajout seul (ledger) : aucune mise à jour, aucune
 * suppression, uniquement des insertions (garantit un historique auditable).
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export class TransactionCoins {
  private constructor(
    public readonly id: string | undefined,
    public readonly membreId: string,
    public readonly delta: number,
    public readonly soldeApres: number,
    public readonly motif: string,
    public readonly cleIdempotence: string,
  ) {}

  static creer(params: {
    membreId: string;
    delta: number;
    soldeAvant: number;
    motif: string;
    cleIdempotence: string;
  }): ResultatOperation<TransactionCoins> {
    const soldeApres = params.soldeAvant + params.delta;
    if (soldeApres < 0) {
      return ResultatOperation.echec('Solde de coins insuffisant');
    }
    return ResultatOperation.ok(
      new TransactionCoins(undefined, params.membreId, params.delta, soldeApres, params.motif, params.cleIdempotence),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    membreId: string;
    delta: number;
    soldeApres: number;
    motif: string;
    cleIdempotence: string;
  }): TransactionCoins {
    return new TransactionCoins(
      donnees.id,
      donnees.membreId,
      donnees.delta,
      donnees.soldeApres,
      donnees.motif,
      donnees.cleIdempotence,
    );
  }
}
