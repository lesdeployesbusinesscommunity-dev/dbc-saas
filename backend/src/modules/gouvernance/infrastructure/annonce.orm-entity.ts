import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'annonces' })
export class AnnonceOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  titre: string;

  @Column({ type: 'text' })
  contenu: string;

  @Column({ name: 'auteur_id', type: 'uuid', nullable: true })
  auteurId: string | null;

  @Column({ name: 'niveau_cible_id', type: 'int', nullable: true })
  niveauCibleId: number | null;

  @Column({ name: 'publiee_le', type: 'timestamptz' })
  publieeLe: Date;
}
