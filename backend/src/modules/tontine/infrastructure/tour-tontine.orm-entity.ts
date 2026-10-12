import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { STATUTS_TOUR_TONTINE, StatutTourTontine } from '../domaine/tour-tontine';

/**
 * "Un seul tour peut être en_cours à la fois par groupe, garantie imposée
 * jusqu'au niveau de la base de données" (cahier de conception, module 4) :
 * index unique partiel sur groupe_id limité aux tours en_cours.
 */
@Entity({ name: 'tours_tontine' })
@Unique(['groupeId', 'numero'])
@Index(['groupeId'], { unique: true, where: `"statut" = 'en_cours'` })
export class TourTontineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'groupe_id', type: 'uuid' })
  groupeId: string;

  @Column({ type: 'int' })
  numero: number;

  @Column({ type: 'enum', enum: STATUTS_TOUR_TONTINE })
  statut: StatutTourTontine;

  @Column({ name: 'beneficiaire_membre_id', type: 'uuid', nullable: true })
  beneficiaireMembreId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  montant: number;

  @Column({ name: 'ouvert_le', type: 'timestamptz' })
  ouvertLe: Date;

  @Column({ name: 'cloture_le', type: 'timestamptz', nullable: true })
  clotureLe: Date | null;

  @Column({ name: 'verse_le', type: 'timestamptz', nullable: true })
  verseLe: Date | null;
}
