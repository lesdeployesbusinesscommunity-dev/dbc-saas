import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'programmes' })
export class ProgrammeOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Nullable le temps que ProgrammesBootstrap donne un code aux lignes semées
  // avant son ajout ; toujours renseigné ensuite.
  @Column({ type: 'varchar', nullable: true, unique: true })
  code: string | null;

  @Column({ name: 'pilier_code', type: 'varchar' })
  pilierCode: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ name: 'niveau_minimum_requis_id', type: 'int', nullable: true })
  niveauMinimumRequisId: number | null;

  @Column({ type: 'varchar', default: 'active' })
  statut: string;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ type: 'text', nullable: true })
  resume: string | null;

  @Column({ type: 'text', nullable: true })
  explication: string | null;

  @Column({ name: 'ajoute_par_admin', type: 'boolean', default: false })
  ajouteParAdmin: boolean;
}
