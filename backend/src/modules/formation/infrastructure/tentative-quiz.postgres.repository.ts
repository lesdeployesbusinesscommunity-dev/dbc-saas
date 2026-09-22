import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TentativeQuiz } from '../domaine/tentative-quiz';
import { TentativeQuizRepositoryPort } from '../domaine/tentative-quiz.repository.port';
import { TentativeQuizOrmEntity } from './tentative-quiz.orm-entity';

@Injectable()
export class TentativeQuizPostgresRepository implements TentativeQuizRepositoryPort {
  constructor(
    @InjectRepository(TentativeQuizOrmEntity)
    private readonly repository: Repository<TentativeQuizOrmEntity>,
  ) {}

  async sauvegarder(tentative: TentativeQuiz): Promise<TentativeQuiz> {
    const ligne = await this.repository.save({
      id: tentative.id,
      quizId: tentative.quizId,
      inscriptionId: tentative.inscriptionId,
      score: tentative.score,
      reussie: tentative.reussie,
      tenteeLe: tentative.tenteeLe,
    });
    return this.versDomaine(ligne);
  }

  async listerParQuizEtInscription(quizId: string, inscriptionId: string): Promise<TentativeQuiz[]> {
    const lignes = await this.repository.find({
      where: { quizId, inscriptionId },
      order: { tenteeLe: 'ASC' },
    });
    return lignes.map((l) => this.versDomaine(l));
  }

  private versDomaine(ligne: TentativeQuizOrmEntity): TentativeQuiz {
    return TentativeQuiz.depuisPersistance({
      id: ligne.id,
      quizId: ligne.quizId,
      inscriptionId: ligne.inscriptionId,
      score: ligne.score,
      reussie: ligne.reussie,
      tenteeLe: ligne.tenteeLe,
    });
  }
}
