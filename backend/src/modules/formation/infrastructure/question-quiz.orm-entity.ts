import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TypeQuestionQuiz } from '../domaine/question-quiz';

@Entity({ name: 'questions_quiz' })
export class QuestionQuizOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @Column({ type: 'varchar' })
  enonce: string;

  @Column({ type: 'varchar' })
  type: TypeQuestionQuiz;

  @Column({ type: 'jsonb', nullable: true })
  choix: string[] | null;

  @Column({ name: 'reponse_correcte', type: 'varchar' })
  reponseCorrecte: string;
}
