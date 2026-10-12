import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentFormation } from '../domaine/formation';
import { QuizFormation } from '../domaine/quiz-formation';

@Entity({ name: 'formations' })
export class FormationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  titre: string;

  @Column({ name: 'niveau_requis_id', type: 'int' })
  niveauRequisId: number;

  @Column({ name: 'pilier_code', type: 'varchar' })
  pilierCode: string;

  // Fiche descriptive (voir Formation.fiche).
  @Column({ type: 'varchar', nullable: true })
  formateur: string | null;

  @Column({ name: 'affiche_url', type: 'varchar', nullable: true })
  afficheUrl: string | null;

  @Column({ name: 'date_debut', type: 'date', nullable: true })
  dateDebut: string | null;

  @Column({ type: 'varchar', nullable: true })
  duree: string | null;

  @Column({ type: 'varchar', nullable: true })
  domaine: string | null;

  @Column({ name: 'coins_recompense', type: 'int', default: 0 })
  coinsRecompense: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  objectifs: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  resultats: string[];

  @Column({ name: 'support_pdf', type: 'jsonb', nullable: true })
  supportPdf: DocumentFormation | null;

  @Column({ name: 'quiz_prerequis', type: 'jsonb', nullable: true })
  quizPrerequis: QuizFormation | null;
}
