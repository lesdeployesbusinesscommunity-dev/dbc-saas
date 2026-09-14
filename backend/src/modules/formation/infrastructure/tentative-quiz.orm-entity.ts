import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tentatives_quiz' })
export class TentativeQuizOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @Column({ name: 'inscription_id', type: 'uuid' })
  inscriptionId: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'boolean' })
  reussie: boolean;

  @Column({ name: 'tentee_le', type: 'timestamptz' })
  tenteeLe: Date;
}
