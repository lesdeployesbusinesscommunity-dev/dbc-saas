/**
 * Entité de domaine pure. Reflète "Antenne" du cahier de conception, module 9.
 * Statuts réels observés (cahier des charges §5.5) : préparation (pas encore
 * ouverte), lancement (ouverte, en cours de déploiement), actif (établie).
 */
export const STATUTS_ANTENNE = ['preparation', 'lancement', 'actif'] as const;
export type StatutAntenne = (typeof STATUTS_ANTENNE)[number];

export class Antenne {
  private constructor(
    public readonly id: string | undefined,
    public readonly zoneId: number,
    public readonly ville: string,
    public statut: StatutAntenne,
    public leaderMembreId: string | null,
    public coordinateurMembreId: string | null,
  ) {}

  static creer(params: { zoneId: number; ville: string; statut?: StatutAntenne }): Antenne {
    return new Antenne(undefined, params.zoneId, params.ville, params.statut ?? 'preparation', null, null);
  }

  static depuisPersistance(donnees: {
    id: string;
    zoneId: number;
    ville: string;
    statut: StatutAntenne;
    leaderMembreId: string | null;
    coordinateurMembreId: string | null;
  }): Antenne {
    return new Antenne(
      donnees.id,
      donnees.zoneId,
      donnees.ville,
      donnees.statut,
      donnees.leaderMembreId,
      donnees.coordinateurMembreId,
    );
  }

  /** Diagramme d'activité "Rejoindre une antenne" — "Antenne active ou en cours ?" */
  estOuverte(): boolean {
    return this.statut !== 'preparation';
  }
}
