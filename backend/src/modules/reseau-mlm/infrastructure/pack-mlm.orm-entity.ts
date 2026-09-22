import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TYPES_GAINS_PACK, TypeGainsPack } from '../domaine/pack-mlm';

@Entity({ name: 'packs_mlm' })
export class PackMlmOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  prix: number;

  @Column({ name: 'points_pv', type: 'int' })
  pointsPv: number;

  @Column({ name: 'niveau_requis_code', type: 'varchar' })
  niveauRequisCode: string;

  @Column({ name: 'type_gains', type: 'enum', enum: TYPES_GAINS_PACK })
  typeGains: TypeGainsPack;
}
