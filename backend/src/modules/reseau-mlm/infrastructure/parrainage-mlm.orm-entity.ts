import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'parrainages_mlm' })
export class ParrainageMlmOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'membre_id', type: 'uuid', unique: true })
  membreId: string;

  // Type réel en base : ltree (extension déjà activée — docker/init-extensions.sql).
  // TypeORM ne connaît pas ce type nativement ; déclaré ainsi pour que synchronize
  // génère la colonne correctement (voir ReseauMlmBootstrap pour l'index GiST).
  @Column({ type: 'ltree' as 'varchar' })
  chemin: string;

  @Column({ type: 'int' })
  profondeur: number;
}
