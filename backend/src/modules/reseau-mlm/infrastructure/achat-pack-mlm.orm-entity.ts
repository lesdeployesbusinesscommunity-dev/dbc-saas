import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { STATUTS_ACHAT_PACK, StatutAchatPack } from '../domaine/achat-pack-mlm';

@Entity({ name: 'achats_pack_mlm' })
export class AchatPackMlmOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ name: 'pack_id', type: 'int' })
  packId: number;

  @Column({ name: 'cle_idempotence_paiement', type: 'varchar', unique: true })
  cleIdempotencePaiement: string;

  @Column({ type: 'enum', enum: STATUTS_ACHAT_PACK })
  statut: StatutAchatPack;

  @Column({ name: 'achete_le', type: 'timestamptz' })
  acheteLe: Date;
}
