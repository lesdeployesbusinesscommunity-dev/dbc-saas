import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../domaine/quiz';
import { QuizRepositoryPort } from '../domaine/quiz.repository.port';
import { QuizOrmEntity } from './quiz.orm-entity';

@Injectable()
export class QuizPostgresRepository implements QuizRepositoryPort {
  constructor(
    @InjectRepository(QuizOrmEntity)
    private readonly repository: Repository<QuizOrmEntity>,
  ) {}

  async sauvegarder(quiz: Quiz): Promise<Quiz> {
    const ligne = await this.repository.save({
      id: quiz.id,
      moduleFormationId: quiz.moduleFormationId,
      seuilReussite: quiz.seuilReussite,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<Quiz | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async trouverParModuleId(moduleFormationId: string): Promise<Quiz | null> {
    const ligne = await this.repository.findOne({ where: { moduleFormationId } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: QuizOrmEntity): Quiz {
    return Quiz.depuisPersistance({ id: ligne.id, moduleFormationId: ligne.moduleFormationId, seuilReussite: ligne.seuilReussite });
  }
}
