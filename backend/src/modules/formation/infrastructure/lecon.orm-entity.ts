import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'lecons' })
export class LeconOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_formation_id', type: 'uuid' })
  moduleFormationId: string;

  @Column({ type: 'varchar' })
  titre: string;

  @Column({ name: 'url_video', type: 'varchar' })
  urlVideo: string;
}
