import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Une seule ligne (id = 1) : les réglages de la plateforme. */
@Entity({ name: 'parametres_plateforme' })
export class ParametresPlateformeOrmEntity {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'jsonb' })
  valeur: Record<string, unknown>;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamptz' })
  modifieLe: Date;
}
