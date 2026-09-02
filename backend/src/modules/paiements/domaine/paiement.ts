/**
 * Entité de domaine pure — aucune dépendance à NestJS, TypeORM ou tout autre
 * framework. Reflète la classe "Paiement" du cahier de conception, module 3.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_PAIEMENT = ['en_attente', 'complete', 'echoue', 'rembourse'] as const;
export type StatutPaiement = (typeof STATUTS_PAIEMENT)[number];

export class Paiement {
  private constructor(
    public readonly id: string | undefined,
    public readonly montant: number,
    public readonly objet: string,
    public readonly cleIdempotence: string,
    public statut: StatutPaiement,
  ) {}

  static creer(params: {
    montant: number;
    objet: string;
    cleIdempotence: string;
  }): ResultatOperation<Paiement> {
    if (params.montant <= 0) {
      return ResultatOperation.echec('Le montant doit être strictement positif');
    }
    return ResultatOperation.ok(
      new Paiement(undefined, params.montant, params.objet, params.cleIdempotence, 'en_attente'),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    montant: number;
    objet: string;
    cleIdempotence: string;
    statut: StatutPaiement;
  }): Paiement {
    return new Paiement(donnees.id, donnees.montant, donnees.objet, donnees.cleIdempotence, donnees.statut);
  }

  marquerComplete(): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seul un paiement en_attente peut être marqué complété');
    }
    this.statut = 'complete';
    return ResultatOperation.ok();
  }

  marquerEchoue(): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seul un paiement en_attente peut être marqué échoué');
    }
    this.statut = 'echoue';
    return ResultatOperation.ok();
  }

  rembourser(): ResultatOperation<void> {
    if (this.statut !== 'complete') {
      return ResultatOperation.echec('Seul un paiement complete peut être remboursé');
    }
    this.statut = 'rembourse';
    return ResultatOperation.ok();
  }
}
