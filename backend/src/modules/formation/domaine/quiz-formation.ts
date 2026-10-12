/**
 * Quiz d'une formation, dans la forme qu'édite l'administrateur (voir
 * l'éditeur de quiz de l'interface admin) : soit le quiz de PRÉ-REQUIS d'une
 * formation (à réussir avant d'ouvrir son contenu), soit un quiz de
 * VALIDATION dans un chapitre (une leçon de type "quiz").
 *
 * La correction se fait toujours ici, côté serveur : un membre ne reçoit
 * jamais les bonnes réponses avant d'avoir répondu (voir sansReponses).
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const SEUIL_REUSSITE_PAR_DEFAUT = 70;

export interface OptionQuiz {
  id: string;
  texte: string;
}

export interface QuestionQuizFormation {
  id: string;
  texte: string;
  options: OptionQuiz[];
  /** Ids des bonnes options : une seule = réponse unique, plusieurs = à cocher. */
  bonnes: string[];
}

export interface QuizFormation {
  titre: string;
  /** Pourcentage de bonnes réponses exigé (1 à 100). */
  seuil: number;
  questions: QuestionQuizFormation[];
}

export interface CorrectionQuiz {
  parQuestion: Record<string, boolean>;
  bonnes: number;
  total: number;
  pourcentage: number;
  reussi: boolean;
}

/** Un quiz est publiable si chaque question a un énoncé, au moins 2 options et au moins une bonne réponse. */
export function validerQuiz(quiz: QuizFormation): ResultatOperation<void> {
  if (!quiz.titre.trim() || quiz.questions.length === 0) {
    return ResultatOperation.echec('Un quiz doit avoir un titre et au moins une question');
  }
  if (quiz.seuil < 1 || quiz.seuil > 100) {
    return ResultatOperation.echec('Le seuil de réussite doit être compris entre 1 et 100');
  }
  const invalide = quiz.questions.find(
    (q) =>
      !q.texte.trim() ||
      q.options.length < 2 ||
      q.bonnes.length === 0 ||
      !q.bonnes.every((id) => q.options.some((o) => o.id === id)),
  );
  if (invalide) {
    return ResultatOperation.echec(`Question incomplète : "${invalide.texte || 'sans énoncé'}"`);
  }
  return ResultatOperation.ok();
}

/**
 * Une question est juste quand les options cochées sont EXACTEMENT les
 * bonnes (ni une de moins, ni une de plus).
 */
export function corrigerQuiz(quiz: QuizFormation, reponses: Record<string, string[]>): CorrectionQuiz {
  const parQuestion: Record<string, boolean> = {};
  let bonnes = 0;
  for (const question of quiz.questions) {
    const donnees = [...new Set(reponses[question.id] ?? [])].sort();
    const attendues = [...question.bonnes].sort();
    const juste = donnees.length === attendues.length && donnees.every((id, i) => id === attendues[i]);
    parQuestion[question.id] = juste;
    if (juste) {
      bonnes++;
    }
  }
  const total = quiz.questions.length;
  const pourcentage = total === 0 ? 0 : Math.round((bonnes / total) * 100);
  return { parQuestion, bonnes, total, pourcentage, reussi: total > 0 && pourcentage >= quiz.seuil };
}

export interface QuizVuParLeMembre {
  titre: string;
  seuil: number;
  questions: (Omit<QuestionQuizFormation, 'bonnes'> & { choixMultiple: boolean })[];
}

/** Le quiz tel qu'un membre le voit avant de répondre : sans les bonnes réponses. */
export function sansReponses(quiz: QuizFormation): QuizVuParLeMembre {
  return {
    titre: quiz.titre,
    seuil: quiz.seuil,
    questions: quiz.questions.map(({ id, texte, options, bonnes }) => ({
      id,
      texte,
      options,
      // Seul le NOMBRE de bonnes réponses est utile au membre (case unique ou cases à cocher).
      choixMultiple: bonnes.length > 1,
    })),
  };
}
