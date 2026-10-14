import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'demandes_membres' })
export class DemandeMembreOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, unknown>;

  /** Profil du membre au moment de la demande. */
  @Column({ type: 'jsonb' })
  profil: Record<string, unknown>;

  @Column({ type: 'varchar' })
  statut: string;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamptz' })
  creeLe: Date;

  @Column({ name: 'decide_le', type: 'timestamptz', nullable: true })
  decideLe: Date | null;

  @Column({ name: 'lue_par_admin', type: 'boolean', default: false })
  lueParAdmin: boolean;

  @Column({ name: 'decision_lue_par_membre', type: 'boolean', default: false })
  decisionLueParMembre: boolean;
}
