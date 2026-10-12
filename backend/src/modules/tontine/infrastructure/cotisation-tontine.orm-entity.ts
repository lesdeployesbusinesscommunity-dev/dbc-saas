import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { STATUTS_COTISATION, StatutCotisation } from '../domaine/cotisation-tontine';

/**
 * Index unique partiel : un membre ne peut avoir qu'une seule cotisation
 * vivante (en attente ou payée) par numéro — une même échéance n'est jamais
 * comptée deux fois, même en cas de requêtes concurrentes.
 */
@Entity({ name: 'cotisations_tontine' })
@Index(['participationId', 'numero'], { unique: true, where: `"statut" <> 'echouee'` })
export class CotisationTontineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'participation_id', type: 'uuid' })
  participationId: string;

  @Index()
  @Column({ name: 'groupe_id', type: 'uuid' })
  groupeId: string;

  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ type: 'int' })
  numero: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  montant: number;

  @Column({ name: 'frais_retrait', type: 'numeric', precision: 14, scale: 2 })
  fraisRetrait: number;

  @Column({ name: 'cle_idempotence_paiement', type: 'varchar', unique: true })
  cleIdempotencePaiement: string;

  @Column({ type: 'enum', enum: STATUTS_COTISATION })
  statut: StatutCotisation;

  @Column({ name: 'payee_le', type: 'timestamptz', nullable: true })
  payeeLe: Date | null;

  @Column({ name: 'en_retard', type: 'boolean', default: false })
  enRetard: boolean;

  @Column({ name: 'cree_le', type: 'timestamptz' })
  creeLe: Date;
}
