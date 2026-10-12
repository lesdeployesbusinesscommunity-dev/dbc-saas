import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TYPES_LECON, TypeLecon } from '../domaine/lecon';
import { QuizFormation } from '../domaine/quiz-formation';

@Entity({ name: 'lecons' })
export class LeconOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_formation_id', type: 'uuid' })
  moduleFormationId: string;

  @Column({ type: 'varchar' })
  titre: string;

  @Column({ type: 'enum', enum: TYPES_LECON, default: 'video' })
  type: TypeLecon;

  // Colonne d'origine (leçons vidéo) : garde son nom, elle porte aussi l'URL d'un PDF.
  @Column({ name: 'url_video', type: 'varchar', default: '' })
  url: string;

  @Column({ type: 'jsonb', nullable: true })
  quiz: QuizFormation | null;

  @Column({ type: 'int', default: 0 })
  ordre: number;
}
