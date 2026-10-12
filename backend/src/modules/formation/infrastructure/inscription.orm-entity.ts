import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { StatutInscription, ResultatPrerequis } from '../domaine/inscription';

@Entity({ name: 'inscriptions_formation' })
@Unique(['membreId', 'formationId'])
export class InscriptionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ name: 'formation_id', type: 'uuid' })
  formationId: string;

  @Column({ type: 'varchar' })
  statut: StatutInscription;

  @Column({ type: 'jsonb', default: () => `'{"reussi": false, "meilleurScore": 0, "tentatives": 0}'` })
  prerequis: ResultatPrerequis;

  @Column({ name: 'terminee_le', type: 'timestamptz', nullable: true })
  termineeLe: Date | null;
}
