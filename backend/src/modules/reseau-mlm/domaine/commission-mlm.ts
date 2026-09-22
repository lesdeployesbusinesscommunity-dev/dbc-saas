/**
 * Entité de domaine pure. Reflète "CommissionMlm" du cahier de conception,
 * module 5 — une commission gagnée par un ancêtre dans l'arbre de parrainage
 * suite à un achat de pack. Créée "due" ; le versement effectif (batch mensuel,
 * cas d'utilisation 5.5) n'est pas encore implémenté (pas d'ordonnanceur en
 * place) — voir mémoire "Packs Longrich réels".
 */
export const STATUTS_COMMISSION = ['due', 'payee'] as const;
export type StatutCommission = (typeof STATUTS_COMMISSION)[number];

export class CommissionMlm {
  private constructor(
    public readonly id: string | undefined,
    public readonly achatId: string,
    public readonly beneficiaireMembreId: string,
    public readonly montant: number,
    public readonly profondeurNiveau: number,
    public statut: StatutCommission,
  ) {}

  static creer(params: {
    achatId: string;
    beneficiaireMembreId: string;
    montant: number;
    profondeurNiveau: number;
  }): CommissionMlm {
    return new CommissionMlm(undefined, params.achatId, params.beneficiaireMembreId, params.montant, params.profondeurNiveau, 'due');
  }

  static depuisPersistance(donnees: {
    id: string;
    achatId: string;
    beneficiaireMembreId: string;
    montant: number;
    profondeurNiveau: number;
    statut: StatutCommission;
  }): CommissionMlm {
    return new CommissionMlm(
      donnees.id,
      donnees.achatId,
      donnees.beneficiaireMembreId,
      donnees.montant,
      donnees.profondeurNiveau,
      donnees.statut,
    );
  }
}
