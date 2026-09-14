import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionQuiz } from '../domaine/question-quiz';
import { QuestionQuizRepositoryPort } from '../domaine/question-quiz.repository.port';
import { QuestionQuizOrmEntity } from './question-quiz.orm-entity';

@Injectable()
export class QuestionQuizPostgresRepository implements QuestionQuizRepositoryPort {
  constructor(
    @InjectRepository(QuestionQuizOrmEntity)
    private readonly repository: Repository<QuestionQuizOrmEntity>,
  ) {}

  async sauvegarder(question: QuestionQuiz): Promise<QuestionQuiz> {
    const ligne = await this.repository.save({
      id: question.id,
      quizId: question.quizId,
      enonce: question.enonce,
      type: question.type,
      choix: question.choix,
      reponseCorrecte: question.reponseCorrecte,
    });
    return this.versDomaine(ligne);
  }

  async listerParQuizId(quizId: string): Promise<QuestionQuiz[]> {
    const lignes = await this.repository.find({ where: { quizId } });
    return lignes.map((l) => this.versDomaine(l));
  }

  private versDomaine(ligne: QuestionQuizOrmEntity): QuestionQuiz {
    return QuestionQuiz.depuisPersistance({
      id: ligne.id,
      quizId: ligne.quizId,
      enonce: ligne.enonce,
      type: ligne.type,
      choix: ligne.choix,
      reponseCorrecte: ligne.reponseCorrecte,
    });
  }
}
