import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { StatutMembre } from '../domaine/membre';

@Entity({ name: 'membres' })
export class MembreOrmEntity {
  // Volontairement PAS de @PrimaryGeneratedColumn : id = Utilisateur.id (module Identité & accès).
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  matricule: string;

  @Column({ type: 'varchar' })
  statut: StatutMembre;

  @Column({ name: 'niveau_actuel_id', type: 'int' })
  niveauActuelId: number;

  // Profil (voir Membre.profil) — nullable : recopié de la demande d'inscription.
  @Column({ type: 'varchar', nullable: true })
  prenom: string | null;

  @Column({ type: 'varchar', nullable: true })
  nom: string | null;

  @Column({ type: 'varchar', nullable: true })
  ville: string | null;

  @Column({ type: 'varchar', nullable: true })
  pays: string | null;

  @Column({ type: 'varchar', nullable: true })
  profession: string | null;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le' })
  modifieLe: Date;
}
