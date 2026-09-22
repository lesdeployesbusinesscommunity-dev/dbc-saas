import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'progressions_lecon' })
@Unique(['inscriptionId', 'leconId'])
export class ProgressionLeconOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inscription_id', type: 'uuid' })
  inscriptionId: string;

  @Column({ name: 'lecon_id', type: 'uuid' })
  leconId: string;

  @Column({ type: 'boolean', default: false })
  terminee: boolean;

  @Column({ name: 'terminee_le', type: 'timestamptz', nullable: true })
  termineeLe: Date | null;
}
