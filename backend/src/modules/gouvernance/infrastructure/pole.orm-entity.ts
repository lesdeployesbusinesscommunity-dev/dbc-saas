import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TYPES_POLE, TypePole } from '../domaine/pole';

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

  // Clé d'icône résolue côté frontend (voir Admin/Gouvernance/poleIcons.js) —
  // "briefcase" par défaut pour les pôles déjà en base avant cette colonne.
  @Column({ type: 'varchar', default: 'briefcase' })
  icone: string;

  @Column({ type: 'enum', enum: TYPES_POLE, default: 'sieges' })
  type: TypePole;

  @Column({ name: 'niveau_code', type: 'varchar', nullable: true })
  niveauCode: string | null;
}
