import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'zones' })
export class ZoneOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ type: 'varchar' })
  type: string;
}
