import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'catalogue_actions_coins' })
export class CatalogueActionsCoinsOrmEntity {
  @PrimaryColumn({ type: 'varchar' })
  code: string;

  @Column({ name: 'valeur_coins', type: 'int' })
  valeurCoins: number;

  @Column({ type: 'boolean', default: true })
  actif: boolean;
}
