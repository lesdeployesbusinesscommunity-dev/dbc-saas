/**
 * Entité de domaine pure. Reflète "ModuleFormation" du cahier de conception,
 * module 7 (LMS) — une subdivision ordonnée d'une Formation, composée de
 * Leçons. C'est le "chapitre" de l'interface, avec ses objectifs.
 */
export class ModuleFormation {
  private constructor(
    public readonly id: string | undefined,
    public readonly formationId: string,
    public titre: string,
    public ordre: number,
    public objectifs: string[],
  ) {}

  static creer(params: { formationId: string; titre: string; ordre: number; objectifs?: string[] }): ModuleFormation {
    return new ModuleFormation(undefined, params.formationId, params.titre, params.ordre, params.objectifs ?? []);
  }

  static depuisPersistance(donnees: {
    id: string;
    formationId: string;
    titre: string;
    ordre: number;
    objectifs: string[];
  }): ModuleFormation {
    return new ModuleFormation(donnees.id, donnees.formationId, donnees.titre, donnees.ordre, donnees.objectifs);
  }

  modifier(params: { titre: string; ordre: number; objectifs: string[] }): void {
    this.titre = params.titre;
    this.ordre = params.ordre;
    this.objectifs = params.objectifs;
  }
}
