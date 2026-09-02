/**
 * Entité de domaine pure. Reflète "Programme" du cahier de conception,
 * module 8. Le niveau minimum requis n'est pas précisé par programme dans
 * les documents disponibles — laissé absent plutôt qu'inventé.
 */
export class Programme {
  private constructor(
    public readonly id: number,
    public readonly pilierCode: string,
    public readonly nom: string,
    public readonly niveauMinimumRequisId: number | null,
  ) {}

  static depuisPersistance(donnees: {
    id: number;
    pilierCode: string;
    nom: string;
    niveauMinimumRequisId: number | null;
  }): Programme {
    return new Programme(donnees.id, donnees.pilierCode, donnees.nom, donnees.niveauMinimumRequisId);
  }
}
