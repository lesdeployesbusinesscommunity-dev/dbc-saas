/**
 * Entité de domaine pure. Reflète "Pilier" du cahier de conception, module 8
 * — module essentiellement consultatif, seme au démarrage avec les 4 vrais
 * piliers DBC (cahier des charges §1.2).
 */
export class Pilier {
  private constructor(
    public readonly code: string,
    public readonly nom: string,
    public readonly tagline: string,
  ) {}

  static depuisPersistance(donnees: { code: string; nom: string; tagline: string }): Pilier {
    return new Pilier(donnees.code, donnees.nom, donnees.tagline);
  }
}
