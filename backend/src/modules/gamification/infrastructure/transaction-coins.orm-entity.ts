import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'transactions_coins' })
export class TransactionCoinsOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ type: 'int' })
  delta: number;

  @Column({ name: 'solde_apres', type: 'int' })
  soldeApres: number;

  @Column({ type: 'varchar' })
  motif: string;

  @Column({ name: 'cle_idempotence', type: 'varchar', unique: true })
  cleIdempotence: string;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe: Date;
}
