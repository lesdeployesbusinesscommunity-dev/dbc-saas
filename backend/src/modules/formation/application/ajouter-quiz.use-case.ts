import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Quiz } from '../domaine/quiz';
import { QuestionQuiz, TypeQuestionQuiz } from '../domaine/question-quiz';
import { QuizRepositoryPort } from '../domaine/quiz.repository.port';
import { QuestionQuizRepositoryPort } from '../domaine/question-quiz.repository.port';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';

export interface QuestionQuizCommande {
  enonce: string;
  type: TypeQuestionQuiz;
  choix?: string[];
  reponseCorrecte: string;
}

export interface AjouterQuizCommande {
  moduleFormationId: string;
  seuilReussite?: number;
  questions: QuestionQuizCommande[];
}

/**
 * Création de contenu (Quiz + questions) par un administrateur — un seul
 * quiz par module (Cahier des Charges §5.1 : "Leçon → Quiz de validation").
 */
@Injectable()
export class AjouterQuizUseCase {
  constructor(
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly quizzes: QuizRepositoryPort,
    private readonly questions: QuestionQuizRepositoryPort,
  ) {}

  async executer(commande: AjouterQuizCommande): Promise<Quiz> {
    const module = await this.modules.trouverParId(commande.moduleFormationId);
    if (!module) {
      throw new NotFoundException('Module de formation introuvable');
    }

    const existant = await this.quizzes.trouverParModuleId(commande.moduleFormationId);
    if (existant) {
      throw new ConflictException('Ce module a déjà un quiz');
    }

    const quiz = Quiz.creer({ moduleFormationId: commande.moduleFormationId, seuilReussite: commande.seuilReussite });
    const quizSauvegarde = await this.quizzes.sauvegarder(quiz);

    for (const q of commande.questions) {
      const question = QuestionQuiz.creer({
        quizId: quizSauvegarde.id!,
        enonce: q.enonce,
        type: q.type,
        choix: q.choix,
        reponseCorrecte: q.reponseCorrecte,
      });
      await this.questions.sauvegarder(question);
    }

    return quizSauvegarde;
  }
}
