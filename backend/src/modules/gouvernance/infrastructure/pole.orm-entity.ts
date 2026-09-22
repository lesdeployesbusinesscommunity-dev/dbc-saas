import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'poles' })
export class PoleOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  ordre: number;
}
