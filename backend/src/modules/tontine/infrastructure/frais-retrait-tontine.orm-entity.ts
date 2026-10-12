import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'frais_retrait_tontine' })
export class FraisRetraitTontineOrmEntity {
  @PrimaryColumn({ name: 'niveau_id', type: 'int' })
  niveauId: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  montant: number;
}
