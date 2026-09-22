import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { STATUTS_PAIEMENT, StatutPaiement } from '../domaine/paiement';

@Entity({ name: 'paiements' })
export class PaiementOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  montant: number;

  @Column({ type: 'varchar' })
  objet: string;

  @Column({ name: 'cle_idempotence', type: 'varchar', unique: true })
  cleIdempotence: string;

  @Column({ type: 'enum', enum: STATUTS_PAIEMENT })
  statut: StatutPaiement;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le' })
  modifieLe: Date;
}
