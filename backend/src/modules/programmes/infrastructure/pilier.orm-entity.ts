import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'piliers' })
export class PilierOrmEntity {
  @PrimaryColumn({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ type: 'varchar' })
  tagline: string;
}
