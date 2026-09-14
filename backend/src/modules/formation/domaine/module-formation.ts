/**
 * Entité de domaine pure. Reflète "ModuleFormation" du cahier de conception,
 * module 7 (LMS) — une subdivision ordonnée d'une Formation, composée de
 * Leçons.
 */
export class ModuleFormation {
  private constructor(
    public readonly id: string | undefined,
    public readonly formationId: string,
    public readonly titre: string,
    public readonly ordre: number,
  ) {}

  static creer(params: { formationId: string; titre: string; ordre: number }): ModuleFormation {
    return new ModuleFormation(undefined, params.formationId, params.titre, params.ordre);
  }

  static depuisPersistance(donnees: {
    id: string;
    formationId: string;
    titre: string;
    ordre: number;
  }): ModuleFormation {
    return new ModuleFormation(donnees.id, donnees.formationId, donnees.titre, donnees.ordre);
  }
}
