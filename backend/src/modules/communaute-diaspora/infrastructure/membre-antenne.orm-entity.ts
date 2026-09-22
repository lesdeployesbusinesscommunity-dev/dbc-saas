import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'membres_antenne' })
export class MembreAntenneOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'antenne_id', type: 'uuid' })
  antenneId: string;

  @Column({ name: 'membre_id', type: 'uuid' })
  membreId: string;
}
