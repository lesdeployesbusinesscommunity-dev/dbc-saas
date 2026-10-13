import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { NoeudReseau } from '../domaine/reseau-territorial';

/** Un arbre par pays, gardé tel quel (JSON) : il est toujours lu et remplacé en entier. */
@Entity({ name: 'reseaux_territoriaux' })
export class ReseauTerritorialOrmEntity {
  @PrimaryColumn({ type: 'varchar' })
  pays: string;

  @Column({ type: 'jsonb', nullable: true })
  racine: NoeudReseau | null;

  @Column({ name: 'titres_niveaux', type: 'jsonb', default: () => "'{}'" })
  titresNiveaux: Record<string, string>;

  @UpdateDateColumn({ name: 'modifie_le' })
  modifieLe: Date;
}
