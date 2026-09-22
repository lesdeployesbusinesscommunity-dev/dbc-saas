import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { STATUTS_UTILISATEUR, StatutUtilisateur } from '../domaine/utilisateur';

/**
 * Modèle de table Postgres — jamais utilisé en dehors de la couche infrastructure.
 * Le mapping vers/depuis l'entité de domaine se fait dans UtilisateurPostgresRepository.
 */
@Entity({ name: 'utilisateurs' })
export class UtilisateurOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  telephone: string;

  // citext (extension activée dans docker/init-extensions.sql) : unicité insensible à la casse.
  @Column({ type: 'citext', nullable: true })
  email: string | null;

  @Column({ name: 'mot_de_passe_hache', type: 'varchar' })
  motDePasseHache: string;

  @Column({ type: 'enum', enum: STATUTS_UTILISATEUR })
  statut: StatutUtilisateur;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le' })
  modifieLe: Date;
}
