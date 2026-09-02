/**
 * Entité de domaine pure. Reflète "AchatPackMlm" du cahier de conception,
 * module 5. Le paiement est initié via le module Paiements (socle partagé) ;
 * la confirmation (et le calcul des commissions qui en découle) n'arrive
 * qu'une fois le paiement complété — voir ConfirmerAchatPackUseCase.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_ACHAT_PACK = ['en_attente', 'confirme'] as const;
export type StatutAchatPack = (typeof STATUTS_ACHAT_PACK)[number];

export class AchatPackMlm {
  private constructor(
    public readonly id: string | undefined,
    public readonly membreId: string,
    public readonly packId: number,
    public readonly cleIdempotencePaiement: string,
    public statut: StatutAchatPack,
    public readonly acheteLe: Date,
  ) {}

  static initier(params: { membreId: string; packId: number; cleIdempotencePaiement: string }): AchatPackMlm {
    return new AchatPackMlm(undefined, params.membreId, params.packId, params.cleIdempotencePaiement, 'en_attente', new Date());
  }

  static depuisPersistance(donnees: {
    id: string;
    membreId: string;
    packId: number;
    cleIdempotencePaiement: string;
    statut: StatutAchatPack;
    acheteLe: Date;
  }): AchatPackMlm {
    return new AchatPackMlm(
      donnees.id,
      donnees.membreId,
      donnees.packId,
      donnees.cleIdempotencePaiement,
      donnees.statut,
      donnees.acheteLe,
    );
  }

  confirmer(): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seul un achat en_attente peut être confirmé');
    }
    this.statut = 'confirme';
    return ResultatOperation.ok();
  }
}
