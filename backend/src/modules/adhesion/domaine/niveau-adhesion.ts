/**
 * Entité de domaine pure. Reflète la classe "NiveauAdhesion" du cahier de
 * conception, module 2 — catalogue de référence, alimenté au démarrage avec
 * les 8 niveaux réels DBC (cahier des charges, section 1.4).
 */
export interface AvantageNiveau {
  libelle: string;
}

export class NiveauAdhesion {
  private constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly nom: string,
    public readonly cotisationMensuelle: number,
    public readonly montantCagnotte: number,
    public readonly commissionParrainage: number,
    public readonly coinsParMois: number,
    private readonly avantages: AvantageNiveau[],
  ) {}

  static depuisPersistance(donnees: {
    id: number;
    code: string;
    nom: string;
    cotisationMensuelle: number;
    montantCagnotte: number;
    commissionParrainage: number;
    coinsParMois: number;
    avantages: AvantageNiveau[];
  }): NiveauAdhesion {
    return new NiveauAdhesion(
      donnees.id,
      donnees.code,
      donnees.nom,
      donnees.cotisationMensuelle,
      donnees.montantCagnotte,
      donnees.commissionParrainage,
      donnees.coinsParMois,
      donnees.avantages,
    );
  }

  listeAvantages(): AvantageNiveau[] {
    return this.avantages;
  }
}
