/**
 * Entité de domaine pure. Reflète "Inscription" du cahier de conception,
 * module 7 (LMS) — lie un Membre à une Formation.
 *
 * Le cahier ne détaille pas les valeurs possibles de "statut" au-delà du
 * champ ; on retient 'en_cours'/'terminee' par analogie avec les autres
 * machines à états du domaine (ex. GroupeTontine). "terminee" est atteint
 * quand toutes les leçons de tous les modules de la formation sont validées.
 *
 * "prerequis" garde le résultat du quiz de pré-requis de la formation (s'il
 * y en a un) : tant qu'il n'est pas réussi, le contenu reste fermé.
 */
export const STATUTS_INSCRIPTION = ['en_cours', 'terminee'] as const;
export type StatutInscription = (typeof STATUTS_INSCRIPTION)[number];

export interface ResultatPrerequis {
  reussi: boolean;
  meilleurScore: number;
  tentatives: number;
}

export const PREREQUIS_NON_TENTE: ResultatPrerequis = { reussi: false, meilleurScore: 0, tentatives: 0 };

export class Inscription {
  private constructor(
    public readonly id: string | undefined,
    public readonly membreId: string,
    public readonly formationId: string,
    public statut: StatutInscription,
    public prerequis: ResultatPrerequis,
    public termineeLe: Date | null,
  ) {}

  static creer(params: { membreId: string; formationId: string }): Inscription {
    return new Inscription(undefined, params.membreId, params.formationId, 'en_cours', { ...PREREQUIS_NON_TENTE }, null);
  }

  static depuisPersistance(donnees: {
    id: string;
    membreId: string;
    formationId: string;
    statut: StatutInscription;
    prerequis: ResultatPrerequis;
    termineeLe: Date | null;
  }): Inscription {
    return new Inscription(
      donnees.id,
      donnees.membreId,
      donnees.formationId,
      donnees.statut,
      donnees.prerequis,
      donnees.termineeLe,
    );
  }

  marquerTerminee(): void {
    if (this.statut !== 'terminee') {
      this.statut = 'terminee';
      this.termineeLe = new Date();
    }
  }

  enregistrerPrerequis(pourcentage: number, reussi: boolean): void {
    this.prerequis = {
      reussi: this.prerequis.reussi || reussi,
      meilleurScore: Math.max(this.prerequis.meilleurScore, pourcentage),
      tentatives: this.prerequis.tentatives + 1,
    };
  }
}
