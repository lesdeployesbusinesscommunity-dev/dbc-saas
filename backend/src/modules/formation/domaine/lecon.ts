/**
 * Entité de domaine pure. Reflète "Lecon" du cahier de conception, module 7
 * (LMS) — unité de contenu au sein d'un ModuleFormation (chapitre). Une leçon
 * est une VIDÉO, un support PDF, ou un QUIZ de validation : les trois comptent
 * de la même façon dans l'avancement du membre (un quiz compte une fois
 * réussi).
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';
import { QuizFormation, validerQuiz } from './quiz-formation';

export const TYPES_LECON = ['video', 'pdf', 'quiz'] as const;
export type TypeLecon = (typeof TYPES_LECON)[number];

export class Lecon {
  private constructor(
    public readonly id: string | undefined,
    public readonly moduleFormationId: string,
    public titre: string,
    public type: TypeLecon,
    /** Fichier de la vidéo ou du PDF ; vide pour un quiz. */
    public url: string,
    public quiz: QuizFormation | null,
    public ordre: number,
  ) {}

  static creer(params: {
    moduleFormationId: string;
    titre: string;
    type?: TypeLecon;
    url?: string;
    quiz?: QuizFormation | null;
    ordre?: number;
  }): ResultatOperation<Lecon> {
    const lecon = new Lecon(undefined, params.moduleFormationId, '', 'video', '', null, 0);
    const resultat = lecon.modifier({
      titre: params.titre,
      type: params.type ?? 'video',
      url: params.url ?? '',
      quiz: params.quiz ?? null,
      ordre: params.ordre ?? 0,
    });
    return resultat.succes ? ResultatOperation.ok(lecon) : ResultatOperation.echec(resultat.erreur!);
  }

  static depuisPersistance(donnees: {
    id: string;
    moduleFormationId: string;
    titre: string;
    type: TypeLecon;
    url: string;
    quiz: QuizFormation | null;
    ordre: number;
  }): Lecon {
    return new Lecon(
      donnees.id,
      donnees.moduleFormationId,
      donnees.titre,
      donnees.type,
      donnees.url,
      donnees.quiz,
      donnees.ordre,
    );
  }

  modifier(params: { titre: string; type: TypeLecon; url: string; quiz: QuizFormation | null; ordre: number }): ResultatOperation<void> {
    if (!params.titre.trim()) {
      return ResultatOperation.echec('Chaque leçon doit avoir un titre');
    }
    if (params.type === 'quiz') {
      if (!params.quiz) {
        return ResultatOperation.echec('Une leçon de type quiz doit contenir un quiz');
      }
      const quiz = validerQuiz(params.quiz);
      if (!quiz.succes) {
        return quiz;
      }
    } else if (!params.url.trim()) {
      return ResultatOperation.echec(`La leçon "${params.titre}" n'a pas de fichier`);
    }
    this.titre = params.titre.trim();
    this.type = params.type;
    this.url = params.type === 'quiz' ? '' : params.url.trim();
    this.quiz = params.type === 'quiz' ? params.quiz : null;
    this.ordre = params.ordre;
    return ResultatOperation.ok();
  }
}
