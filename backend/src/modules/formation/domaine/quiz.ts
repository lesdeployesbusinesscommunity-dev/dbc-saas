/**
 * Entité de domaine pure. N'existe pas dans le Cahier de conception (module 7
 * n'y modélise pas de quiz) mais est explicitement requise par le Cahier des
 * Charges §5.1 : "Leçon → Quiz de validation", score minimum configurable
 * (70% par défaut) pour valider un module.
 */
export const SEUIL_REUSSITE_PAR_DEFAUT = 70;

export class Quiz {
  private constructor(
    public readonly id: string | undefined,
    public readonly moduleFormationId: string,
    public readonly seuilReussite: number,
  ) {}

  static creer(params: { moduleFormationId: string; seuilReussite?: number }): Quiz {
    return new Quiz(undefined, params.moduleFormationId, params.seuilReussite ?? SEUIL_REUSSITE_PAR_DEFAUT);
  }

  static depuisPersistance(donnees: { id: string; moduleFormationId: string; seuilReussite: number }): Quiz {
    return new Quiz(donnees.id, donnees.moduleFormationId, donnees.seuilReussite);
  }
}
