import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

/** Le couple (vague, rang) est unique : deux membres ne peuvent jamais partager le même tour de passage. */
@Entity({ name: 'participations_tontine' })
@Unique(['groupeId', 'rang'])
@Unique(['groupeId', 'membreId'])
export class ParticipationTontineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'groupe_id', type: 'uuid' })
  groupeId: string;

  @Index()
  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ type: 'int' })
  rang: number;

  @Column({ name: 'rejoint_le', type: 'timestamptz' })
  rejointLe: Date;

  @Column({ name: 'beneficiaire_le', type: 'timestamptz', nullable: true })
  beneficiaireLe: Date | null;
}
