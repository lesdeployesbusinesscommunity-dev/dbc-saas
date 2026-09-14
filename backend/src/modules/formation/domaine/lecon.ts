/**
 * Entité de domaine pure. Reflète "Lecon" du cahier de conception, module 7
 * (LMS) — unité de contenu (vidéo) au sein d'un ModuleFormation.
 */
export class Lecon {
  private constructor(
    public readonly id: string | undefined,
    public readonly moduleFormationId: string,
    public readonly titre: string,
    public readonly urlVideo: string,
  ) {}

  static creer(params: { moduleFormationId: string; titre: string; urlVideo: string }): Lecon {
    return new Lecon(undefined, params.moduleFormationId, params.titre, params.urlVideo);
  }

  static depuisPersistance(donnees: {
    id: string;
    moduleFormationId: string;
    titre: string;
    urlVideo: string;
  }): Lecon {
    return new Lecon(donnees.id, donnees.moduleFormationId, donnees.titre, donnees.urlVideo);
  }
}
