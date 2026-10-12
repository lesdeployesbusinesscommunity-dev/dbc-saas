import { BadRequestException, Injectable } from '@nestjs/common';
import { CorrectionQuiz, QuizFormation, corrigerQuiz } from '../domaine/quiz-formation';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { ProgressionFormationService } from './progression-formation.service';

export interface ResultatQuizFormation {
  correction: CorrectionQuiz;
  /** Les bonnes réponses, révélées seulement APRÈS la réponse du membre. */
  bonnesReponses: Record<string, string[]>;
  formationTerminee: boolean;
}

function bonnesReponses(quiz: QuizFormation): Record<string, string[]> {
  return Object.fromEntries(quiz.questions.map((q) => [q.id, q.bonnes]));
}

/**
 * Un membre répond à un quiz de sa formation ; la correction se fait ici,
 * côté serveur. Deux cas :
 * - quiz de VALIDATION d'un chapitre : réussi, il compte comme une leçon
 *   terminée (et peut achever la formation) ;
 * - quiz de PRÉ-REQUIS : réussi, il ouvre le contenu de la formation.
 * Toutes les tentatives sont comptées, le meilleur score est gardé.
 */
@Injectable()
export class RepondreQuizFormationUseCase {
  constructor(
    private readonly suivi: ProgressionFormationService,
    private readonly progressions: ProgressionLeconRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
  ) {}

  async quizDeLecon(commande: {
    membreId: string;
    leconId: string;
    reponses: Record<string, string[]>;
  }): Promise<ResultatQuizFormation> {
    const { lecon, formation } = await this.suivi.trouverLecon(commande.leconId);
    if (lecon.type !== 'quiz' || !lecon.quiz) {
      throw new BadRequestException('Cette leçon n’est pas un quiz');
    }
    const inscription = await this.suivi.inscription(commande.membreId, formation);
    this.suivi.exigerPrerequis(formation, inscription);

    const correction = corrigerQuiz(lecon.quiz, commande.reponses);
    const progression = await this.suivi.progression(inscription, lecon);
    progression.enregistrerTentativeQuiz(correction.pourcentage, correction.reussi);
    await this.progressions.sauvegarder(progression);
    const formationTerminee = await this.suivi.verifierAchevement(inscription, formation);

    return { correction, bonnesReponses: bonnesReponses(lecon.quiz), formationTerminee };
  }

  async quizDePrerequis(commande: {
    membreId: string;
    formationId: string;
    reponses: Record<string, string[]>;
  }): Promise<ResultatQuizFormation> {
    const formation = await this.suivi.trouverFormation(commande.formationId);
    const quiz = formation.fiche.quizPrerequis;
    if (!quiz) {
      throw new BadRequestException('Cette formation n’a pas de quiz de pré-requis');
    }
    const inscription = await this.suivi.inscription(commande.membreId, formation);
    const correction = corrigerQuiz(quiz, commande.reponses);
    inscription.enregistrerPrerequis(correction.pourcentage, correction.reussi);
    await this.inscriptions.sauvegarder(inscription);

    return { correction, bonnesReponses: bonnesReponses(quiz), formationTerminee: false };
  }
}
