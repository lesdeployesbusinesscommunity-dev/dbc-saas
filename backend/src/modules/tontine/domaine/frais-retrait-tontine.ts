/**
 * Entité de domaine pure. Frais de retrait Mobile Money ajoutés à chaque dépôt
 * de cotisation, fixés par l'administrateur pour chaque niveau (les frais des
 * opérateurs évoluent). Absents pour un niveau = 0 FCFA.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export class FraisRetraitTontine {
  private constructor(
    public readonly niveauId: number,
    public readonly montant: number,
  ) {}

  static definir(params: { niveauId: number; montant: number }): ResultatOperation<FraisRetraitTontine> {
    if (!Number.isFinite(params.montant) || params.montant < 0) {
      return ResultatOperation.echec('Les frais de retrait doivent être positifs ou nuls');
    }
    return ResultatOperation.ok(new FraisRetraitTontine(params.niveauId, params.montant));
  }

  static depuisPersistance(donnees: { niveauId: number; montant: number }): FraisRetraitTontine {
    return new FraisRetraitTontine(donnees.niveauId, donnees.montant);
  }
}
