import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'historique_niveau_membre' })
export class HistoriqueNiveauMembreOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ name: 'niveau_id', type: 'int' })
  niveauId: number;

  @Column({ type: 'varchar' })
  motif: string;

  @Column({ name: 'debut_le', type: 'timestamptz' })
  debutLe: Date;

  @Column({ name: 'fin_le', type: 'timestamptz', nullable: true })
  finLe: Date | null;
}
