import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'preferences_membres' })
export class PreferencesMembreOrmEntity {
  @PrimaryColumn({ name: 'membre_id', type: 'uuid' })
  membreId: string;

  @Column({ type: 'jsonb' })
  valeur: Record<string, unknown>;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamptz' })
  modifieLe: Date;
}
