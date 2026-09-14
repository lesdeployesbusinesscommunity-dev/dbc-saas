import { Quiz } from './quiz';

export abstract class QuizRepositoryPort {
  abstract sauvegarder(quiz: Quiz): Promise<Quiz>;
  abstract trouverParId(id: string): Promise<Quiz | null>;
  abstract trouverParModuleId(moduleFormationId: string): Promise<Quiz | null>;
}
