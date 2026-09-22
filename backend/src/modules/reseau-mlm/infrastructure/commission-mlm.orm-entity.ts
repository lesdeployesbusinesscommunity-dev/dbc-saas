import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { STATUTS_COMMISSION, StatutCommission } from '../domaine/commission-mlm';

@Entity({ name: 'commissions_mlm' })
export class CommissionMlmOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'achat_id', type: 'uuid' })
  achatId: string;

  @Column({ name: 'beneficiaire_membre_id', type: 'uuid' })
  beneficiaireMembreId: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  montant: number;

  @Column({ name: 'profondeur_niveau', type: 'int' })
  profondeurNiveau: number;

  @Column({ type: 'enum', enum: STATUTS_COMMISSION })
  statut: StatutCommission;
}
