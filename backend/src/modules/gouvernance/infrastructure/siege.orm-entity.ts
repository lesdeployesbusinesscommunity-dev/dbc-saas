import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sieges' })
export class SiegeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pole_id', type: 'int' })
  poleId: number;

  @Column({ type: 'varchar' })
  titre: string;

  @Column({ type: 'int' })
  ordre: number;

  @Column({ name: 'membre_id', type: 'uuid', nullable: true })
  membreId: string | null;
}
