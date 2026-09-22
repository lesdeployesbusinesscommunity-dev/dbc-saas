import { QuestionQuiz } from './question-quiz';

export abstract class QuestionQuizRepositoryPort {
  abstract sauvegarder(question: QuestionQuiz): Promise<QuestionQuiz>;
  abstract listerParQuizId(quizId: string): Promise<QuestionQuiz[]>;
}
