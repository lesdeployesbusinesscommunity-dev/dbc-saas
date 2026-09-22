import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'modules_formation' })
export class ModuleFormationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'formation_id', type: 'uuid' })
  formationId: string;

  @Column({ type: 'varchar' })
  titre: string;

  @Column({ type: 'int' })
  ordre: number;
}
