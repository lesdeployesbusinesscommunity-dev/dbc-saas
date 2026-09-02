import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'programmes' })
export class ProgrammeOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pilier_code', type: 'varchar' })
  pilierCode: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ name: 'niveau_minimum_requis_id', type: 'int', nullable: true })
  niveauMinimumRequisId: number | null;
}
