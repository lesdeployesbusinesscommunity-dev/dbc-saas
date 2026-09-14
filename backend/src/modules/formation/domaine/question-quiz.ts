/**
 * Entité de domaine pure — Cahier des Charges §5.1 : "Types de questions :
 * QCM · Vrai/Faux · Réponse courte · Mise en situation". La correction reste
 * volontairement simple (comparaison texte insensible à la casse) — aucune
 * spec de correction avancée (ex. tolérance, mots-clés) n'est donnée.
 */
export const TYPES_QUESTION_QUIZ = ['qcm', 'vrai_faux', 'reponse_courte', 'mise_situation'] as const;
export type TypeQuestionQuiz = (typeof TYPES_QUESTION_QUIZ)[number];

export class QuestionQuiz {
  private constructor(
    public readonly id: string | undefined,
    public readonly quizId: string,
    public readonly enonce: string,
    public readonly type: TypeQuestionQuiz,
    public readonly choix: string[] | null,
    public readonly reponseCorrecte: string,
  ) {}

  static creer(params: {
    quizId: string;
    enonce: string;
    type: TypeQuestionQuiz;
    choix?: string[] | null;
    reponseCorrecte: string;
  }): QuestionQuiz {
    return new QuestionQuiz(undefined, params.quizId, params.enonce, params.type, params.choix ?? null, params.reponseCorrecte);
  }

  static depuisPersistance(donnees: {
    id: string;
    quizId: string;
    enonce: string;
    type: TypeQuestionQuiz;
    choix: string[] | null;
    reponseCorrecte: string;
  }): QuestionQuiz {
    return new QuestionQuiz(donnees.id, donnees.quizId, donnees.enonce, donnees.type, donnees.choix, donnees.reponseCorrecte);
  }

  estCorrecte(reponse: string): boolean {
    return reponse.trim().toLowerCase() === this.reponseCorrecte.trim().toLowerCase();
  }
}
