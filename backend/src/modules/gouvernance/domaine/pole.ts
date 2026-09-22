/**
 * Entité de domaine pure. Un "pôle" regroupe un ou plusieurs sièges (voir
 * Siege) — reflète l'organigramme réel de la gouvernance DBC (déjà présent
 * dans la maquette frontend : Founding Leadership, Executive Committee,
 * Chapter Leaders Network). Données de référence, peuplées au démarrage
 * (voir GouvernancePolesBootstrap) — pas de création via l'API pour
 * l'instant.
 */
export class Pole {
  private constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly nom: string,
    public readonly description: string,
    public readonly ordre: number,
  ) {}

  static depuisPersistance(donnees: {
    id: number;
    code: string;
    nom: string;
    description: string;
    ordre: number;
  }): Pole {
    return new Pole(donnees.id, donnees.code, donnees.nom, donnees.description, donnees.ordre);
  }
}
