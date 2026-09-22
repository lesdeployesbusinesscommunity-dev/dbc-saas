/**
 * Entité de domaine pure. Reflète "Formation" du cahier de conception,
 * module 7 (LMS). Deux champs n'y figurent pas mais sont explicitement
 * requis par le Cahier des Charges §5.1 / §3.2 (schéma `formations` :
 * "pilier_id · niveau_requis") :
 * - `niveauRequisId` : accès conditionnel au niveau DBC (ex. École des
 *   Affaires Niv.2 requiert DBC Bâtisseur) — référence par id vers
 *   NiveauAdhesion (module Adhésion).
 * - `pilierCode` : rattachement au pilier stratégique — référence par code
 *   vers Pilier (module Programmes, "former"/"financer"/"reseauter"/"investir").
 * Jamais de dépendance directe entre entités de modules — références par
 * identifiant uniquement.
 */
export class Formation {
  private constructor(
    public readonly id: string | undefined,
    public readonly code: string,
    public readonly titre: string,
    public readonly niveauRequisId: number,
    public readonly pilierCode: string,
  ) {}

  static creer(params: { code: string; titre: string; niveauRequisId: number; pilierCode: string }): Formation {
    return new Formation(undefined, params.code, params.titre, params.niveauRequisId, params.pilierCode);
  }

  static depuisPersistance(donnees: {
    id: string;
    code: string;
    titre: string;
    niveauRequisId: number;
    pilierCode: string;
  }): Formation {
    return new Formation(donnees.id, donnees.code, donnees.titre, donnees.niveauRequisId, donnees.pilierCode);
  }
}
