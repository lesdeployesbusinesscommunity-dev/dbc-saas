import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AvantageNiveau } from '../domaine/niveau-adhesion';

@Entity({ name: 'niveaux_adhesion' })
export class NiveauAdhesionOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ name: 'cotisation_mensuelle', type: 'numeric', precision: 14, scale: 2 })
  cotisationMensuelle: number;

  @Column({ name: 'montant_cagnotte', type: 'numeric', precision: 14, scale: 2 })
  montantCagnotte: number;

  @Column({ name: 'commission_parrainage', type: 'numeric', precision: 14, scale: 2 })
  commissionParrainage: number;

  @Column({ name: 'coins_par_mois', type: 'int' })
  coinsParMois: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  avantages: AvantageNiveau[];
}
