/**
 * Entité de domaine pure. Reflète "Inscription" du cahier de conception,
 * module 7 (LMS) — lie un Membre à une Formation.
 *
 * Le cahier ne détaille pas les valeurs possibles de "statut" au-delà du
 * champ ; on retient 'en_cours'/'terminee' par analogie avec les autres
 * machines à états du domaine (ex. GroupeTontine). "terminee" est atteint
 * quand toutes les leçons de tous les modules de la formation sont validées.
 */
export const STATUTS_INSCRIPTION = ['en_cours', 'terminee'] as const;
export type StatutInscription = (typeof STATUTS_INSCRIPTION)[number];

export class Inscription {
  private constructor(
    public readonly id: string | undefined,
    public readonly membreId: string,
    public readonly formationId: string,
    public statut: StatutInscription,
  ) {}

  static creer(params: { membreId: string; formationId: string }): Inscription {
    return new Inscription(undefined, params.membreId, params.formationId, 'en_cours');
  }

  static depuisPersistance(donnees: {
    id: string;
    membreId: string;
    formationId: string;
    statut: StatutInscription;
  }): Inscription {
    return new Inscription(donnees.id, donnees.membreId, donnees.formationId, donnees.statut);
  }

  marquerTerminee(): void {
    this.statut = 'terminee';
  }
}
