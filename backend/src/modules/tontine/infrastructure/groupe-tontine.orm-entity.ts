import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { STATUTS_GROUPE_TONTINE, StatutGroupeTontine } from '../domaine/groupe-tontine';

@Entity({ name: 'groupes_tontine' })
@Unique(['niveauId', 'numero'])
export class GroupeTontineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'niveau_id', type: 'int' })
  niveauId: number;

  @Column({ type: 'int' })
  numero: number;

  @Column({ name: 'cotisation_mensuelle', type: 'numeric', precision: 14, scale: 2 })
  cotisationMensuelle: number;

  @Column({ name: 'montant_cagnotte', type: 'numeric', precision: 14, scale: 2 })
  montantCagnotte: number;

  @Column({ name: 'responsable_membre_id', type: 'uuid', nullable: true })
  responsableMembreId: string | null;

  @Column({ type: 'enum', enum: STATUTS_GROUPE_TONTINE })
  statut: StatutGroupeTontine;

  @Column({ name: 'cree_le', type: 'timestamptz' })
  creeLe: Date;
}
