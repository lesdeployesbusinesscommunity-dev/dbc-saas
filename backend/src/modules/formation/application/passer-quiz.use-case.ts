import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TentativeQuiz, MAX_TENTATIVES_QUIZ, DELAI_HEURES_ENTRE_TENTATIVES } from '../domaine/tentative-quiz';
import { Certificat } from '../domaine/certificat';
import { QuizRepositoryPort } from '../domaine/quiz.repository.port';
import { QuestionQuizRepositoryPort } from '../domaine/question-quiz.repository.port';
import { TentativeQuizRepositoryPort } from '../domaine/tentative-quiz.repository.port';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { CertificatRepositoryPort } from '../domaine/certificat.repository.port';
import { ReclamerGainCoinsUseCase } from '../../gamification/application/reclamer-gain-coins.use-case';

export interface ReponseQuizCommande {
  questionId: string;
  reponse: string;
}

export interface PasserQuizCommande {
  membreId: string;
  quizId: string;
  reponses: ReponseQuizCommande[];
}

export interface ResultatQuiz {
  tentative: TentativeQuiz;
  certificatDelivre: boolean;
}

/**
 * Cas d'utilisation "Passer un quiz" — n'existe pas dans le Cahier de
 * conception (pas de Quiz modélisé) mais concrétise le Cahier des Charges
 * §5.1 : score minimum pour valider un module, max 3 tentatives avec 24h de
 * délai, et surtout le vrai déclencheur du gain de coins et du certificat —
 * "+50 Coins à la complétion d'une formation avec validation (score ≥ 70%)",
 * pas au simple visionnage d'un module (contrairement à l'ancienne version
 * de SuivreLeconUseCase, corrigée en conséquence).
 */
@Injectable()
export class PasserQuizUseCase {
  constructor(
    private readonly quizzes: QuizRepositoryPort,
    private readonly questions: QuestionQuizRepositoryPort,
    private readonly tentatives: TentativeQuizRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly lecons: LeconRepositoryPort,
    private readonly progressions: ProgressionLeconRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly certificats: CertificatRepositoryPort,
    private readonly reclamerGainCoins: ReclamerGainCoinsUseCase,
  ) {}

  async executer(commande: PasserQuizCommande): Promise<ResultatQuiz> {
    const quiz = await this.quizzes.trouverParId(commande.quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz introuvable');
    }
    const moduleFormation = await this.modules.trouverParId(quiz.moduleFormationId);
    if (!moduleFormation) {
      throw new NotFoundException('Module de formation introuvable');
    }
    const inscription = await this.inscriptions.trouverParMembreEtFormation(
      commande.membreId,
      moduleFormation.formationId,
    );
    if (!inscription) {
      throw new BadRequestException('Inscription à la formation requise avant de passer un quiz');
    }

    await this.verifierLeconsTerminees(moduleFormation.id!, inscription.id!);
    await this.verifierTentativesAutorisees(quiz.id!, inscription.id!);

    const score = await this.calculerScore(quiz.id!, commande.reponses);
    const tentative = TentativeQuiz.creer({
      quizId: quiz.id!,
      inscriptionId: inscription.id!,
      score,
      seuilReussite: quiz.seuilReussite,
    });
    const tentativeSauvegardee = await this.tentatives.sauvegarder(tentative);

    let certificatDelivre = false;
    if (tentativeSauvegardee.reussie && inscription.statut !== 'terminee') {
      const formationValidee = await this.formationEntierementValidee(moduleFormation.formationId, inscription.id!);
      if (formationValidee) {
        inscription.marquerTerminee();
        await this.inscriptions.sauvegarder(inscription);

        const certificatExistant = await this.certificats.trouverParInscriptionId(inscription.id!);
        if (!certificatExistant) {
          const certificat = Certificat.creer({ inscriptionId: inscription.id!, codeVerification: randomUUID() });
          await this.certificats.sauvegarder(certificat);
          certificatDelivre = true;
        }

        await this.reclamerGainCoins.executer({
          membreId: inscription.membreId,
          codeAction: 'formation_completee',
          cleIdempotence: `formation_completee:${inscription.id}`,
        });
      }
    }

    return { tentative: tentativeSauvegardee, certificatDelivre };
  }

  private async verifierLeconsTerminees(moduleFormationId: string, inscriptionId: string): Promise<void> {
    const leconsDuModule = await this.lecons.listerParModuleId(moduleFormationId);
    const progressionsInscription = await this.progressions.listerParInscriptionId(inscriptionId);
    const idsTermines = new Set(progressionsInscription.filter((p) => p.terminee).map((p) => p.leconId));
    if (!leconsDuModule.every((l) => idsTermines.has(l.id!))) {
      throw new BadRequestException('Toutes les leçons du module doivent être suivies avant de passer le quiz');
    }
  }

  private async verifierTentativesAutorisees(quizId: string, inscriptionId: string): Promise<void> {
    const tentativesPrecedentes = await this.tentatives.listerParQuizEtInscription(quizId, inscriptionId);
    if (tentativesPrecedentes.length >= MAX_TENTATIVES_QUIZ) {
      throw new BadRequestException(`Nombre maximum de tentatives atteint (${MAX_TENTATIVES_QUIZ})`);
    }
    const derniereTentative = tentativesPrecedentes.at(-1);
    if (derniereTentative) {
      const heuresEcoulees = (Date.now() - derniereTentative.tenteeLe.getTime()) / (1000 * 60 * 60);
      if (heuresEcoulees < DELAI_HEURES_ENTRE_TENTATIVES) {
        throw new BadRequestException(`Il faut attendre ${DELAI_HEURES_ENTRE_TENTATIVES}h entre deux tentatives`);
      }
    }
  }

  private async calculerScore(quizId: string, reponses: ReponseQuizCommande[]): Promise<number> {
    const questionsDuQuiz = await this.questions.listerParQuizId(quizId);
    if (questionsDuQuiz.length === 0) {
      return 0;
    }
    const reponseParQuestionId = new Map(reponses.map((r) => [r.questionId, r.reponse]));
    const nbCorrectes = questionsDuQuiz.filter((q) => {
      const reponse = reponseParQuestionId.get(q.id!);
      return reponse !== undefined && q.estCorrecte(reponse);
    }).length;
    return Math.round((nbCorrectes / questionsDuQuiz.length) * 100);
  }

  private async formationEntierementValidee(formationId: string, inscriptionId: string): Promise<boolean> {
    const modulesDeLaFormation = await this.modules.listerParFormationId(formationId);
    for (const module of modulesDeLaFormation) {
      const quizDuModule = await this.quizzes.trouverParModuleId(module.id!);
      if (!quizDuModule) {
        return false;
      }
      const tentatives = await this.tentatives.listerParQuizEtInscription(quizDuModule.id!, inscriptionId);
      if (!tentatives.some((t) => t.reussie)) {
        return false;
      }
    }
    return true;
  }
}
