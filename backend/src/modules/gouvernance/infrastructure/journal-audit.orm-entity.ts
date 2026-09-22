import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'journal_audit' })
export class JournalAuditOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ name: 'type_entite', type: 'varchar' })
  typeEntite: string;

  @Column({ name: 'acteur_id', type: 'uuid', nullable: true })
  acteurId: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadonnees: Record<string, unknown>;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe: Date;
}
