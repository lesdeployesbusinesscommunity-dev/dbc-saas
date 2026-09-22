/**
 * Entité de domaine pure — Cahier des Charges §5.1 : "Maximum 3 tentatives ·
 * Délai 24h entre tentatives". Une tentative est immuable une fois créée
 * (score et résultat figés au moment de la passation).
 */
export const MAX_TENTATIVES_QUIZ = 3;
export const DELAI_HEURES_ENTRE_TENTATIVES = 24;

export class TentativeQuiz {
  private constructor(
    public readonly id: string | undefined,
    public readonly quizId: string,
    public readonly inscriptionId: string,
    public readonly score: number,
    public readonly reussie: boolean,
    public readonly tenteeLe: Date,
  ) {}

  static creer(params: { quizId: string; inscriptionId: string; score: number; seuilReussite: number }): TentativeQuiz {
    return new TentativeQuiz(
      undefined,
      params.quizId,
      params.inscriptionId,
      params.score,
      params.score >= params.seuilReussite,
      new Date(),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    quizId: string;
    inscriptionId: string;
    score: number;
    reussie: boolean;
    tenteeLe: Date;
  }): TentativeQuiz {
    return new TentativeQuiz(donnees.id, donnees.quizId, donnees.inscriptionId, donnees.score, donnees.reussie, donnees.tenteeLe);
  }
}
