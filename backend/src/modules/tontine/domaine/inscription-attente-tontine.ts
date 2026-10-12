/**
 * Entité de domaine pure. Un membre qui ne veut pas (ou ne peut pas) entrer
 * dans la vague la plus récente de son niveau s'inscrit ici en attendant la
 * prochaine. À l'ouverture d'une nouvelle vague, les inscrits sont affectés
 * par ordre d'inscription, dans la limite des places.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_INSCRIPTION_ATTENTE = ['en_attente', 'affectee'] as const;
export type StatutInscriptionAttente = (typeof STATUTS_INSCRIPTION_ATTENTE)[number];

export class InscriptionAttenteTontine {
  private constructor(
    public readonly id: string | undefined,
    public readonly membreId: string,
    public readonly niveauId: number,
    public statut: StatutInscriptionAttente,
    public groupeId: string | null,
    public readonly inscritLe: Date,
  ) {}

  static creer(params: { membreId: string; niveauId: number }): InscriptionAttenteTontine {
    return new InscriptionAttenteTontine(undefined, params.membreId, params.niveauId, 'en_attente', null, new Date());
  }

  static depuisPersistance(donnees: {
    id: string;
    membreId: string;
    niveauId: number;
    statut: StatutInscriptionAttente;
    groupeId: string | null;
    inscritLe: Date;
  }): InscriptionAttenteTontine {
    return new InscriptionAttenteTontine(
      donnees.id,
      donnees.membreId,
      donnees.niveauId,
      donnees.statut,
      donnees.groupeId,
      donnees.inscritLe,
    );
  }

  affecter(groupeId: string): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Cette inscription a déjà été affectée à une vague');
    }
    this.statut = 'affectee';
    this.groupeId = groupeId;
    return ResultatOperation.ok();
  }
}
