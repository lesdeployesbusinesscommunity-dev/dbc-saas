import { TentativeQuiz } from './tentative-quiz';

export abstract class TentativeQuizRepositoryPort {
  abstract sauvegarder(tentative: TentativeQuiz): Promise<TentativeQuiz>;
  /** Triées par date de passation croissante — nécessaire pour retrouver la dernière tentative. */
  abstract listerParQuizEtInscription(quizId: string, inscriptionId: string): Promise<TentativeQuiz[]>;
}
