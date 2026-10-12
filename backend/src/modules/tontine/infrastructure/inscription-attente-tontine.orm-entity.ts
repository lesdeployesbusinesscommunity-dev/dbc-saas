import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { STATUTS_INSCRIPTION_ATTENTE, StatutInscriptionAttente } from '../domaine/inscription-attente-tontine';

/** Un membre ne peut figurer qu'une fois sur la liste d'attente. */
@Entity({ name: 'inscriptions_attente_tontine' })
@Index(['membreId'], { unique: true, where: `"statut" = 'en_attente'` })
export class InscriptionAttenteTontineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ name: 'niveau_id', type: 'int' })
  niveauId: number;

  @Column({ type: 'enum', enum: STATUTS_INSCRIPTION_ATTENTE })
  statut: StatutInscriptionAttente;

  @Column({ name: 'groupe_id', type: 'uuid', nullable: true })
  groupeId: string | null;

  @Column({ name: 'inscrit_le', type: 'timestamptz' })
  inscritLe: Date;
}
