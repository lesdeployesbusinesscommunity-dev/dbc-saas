import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { STATUTS_ANTENNE, StatutAntenne } from '../domaine/antenne';

@Entity({ name: 'antennes' })
export class AntenneOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone_id', type: 'int' })
  zoneId: number;

  @Column({ type: 'varchar' })
  ville: string;

  @Column({ type: 'enum', enum: STATUTS_ANTENNE })
  statut: StatutAntenne;

  @Column({ name: 'leader_membre_id', type: 'uuid', nullable: true })
  leaderMembreId: string | null;

  @Column({ name: 'coordinateur_membre_id', type: 'uuid', nullable: true })
  coordinateurMembreId: string | null;
}
