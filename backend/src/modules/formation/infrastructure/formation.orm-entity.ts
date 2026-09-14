import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'formations' })
export class FormationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  titre: string;

  @Column({ name: 'niveau_requis_id', type: 'int' })
  niveauRequisId: number;

  @Column({ name: 'pilier_code', type: 'varchar' })
  pilierCode: string;
}
