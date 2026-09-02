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

  @CreateDateColumn({ name: 'cree_le' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le' })
  modifieLe: Date;
}
