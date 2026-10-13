import { IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoeudReseau } from '../../domaine/reseau-territorial';

/**
 * Arbre d'un pays : { id, memberId, coordinatorId, label, children: [...] }.
 * Récursif : sa forme est vérifiée par noeudDepuisCorps (class-validator ne
 * sait pas décrire un arbre de profondeur libre).
 */
export class EnregistrerReseauTerritorialDto {
  @ApiPropertyOptional({
    nullable: true,
    example: { id: 'n1', memberId: null, coordinatorId: null, label: null, children: [] },
    description: 'Racine (responsable national) ; null pour effacer l’organisation du pays',
  })
  @IsOptional()
  @IsObject()
  tree?: Record<string, unknown> | null;

  @ApiProperty({ example: { '0': 'Le Visionnaire', '1': 'Responsable Régional' } })
  @IsObject()
  levelTitles: Record<string, string>;
}

const texteOuNull = (valeur: unknown): string | null =>
  typeof valeur === 'string' && valeur.trim() ? valeur.trim() : null;

/** Convertit l'arbre reçu en NoeudReseau, en ne gardant que les champs attendus. */
export function noeudDepuisCorps(brut: unknown, profondeur = 0): NoeudReseau {
  if (!brut || typeof brut !== 'object' || profondeur > 20) {
    return { id: '', membreId: null, coordinateurId: null, libelle: null, enfants: [] };
  }
  const noeud = brut as Record<string, unknown>;
  return {
    id: typeof noeud.id === 'string' ? noeud.id : '',
    membreId: texteOuNull(noeud.memberId),
    coordinateurId: texteOuNull(noeud.coordinatorId),
    libelle: texteOuNull(noeud.label),
    enfants: Array.isArray(noeud.children) ? noeud.children.map((enfant) => noeudDepuisCorps(enfant, profondeur + 1)) : [],
  };
}

export function noeudVersReponse(noeud: NoeudReseau): unknown {
  return {
    id: noeud.id,
    memberId: noeud.membreId,
    coordinatorId: noeud.coordinateurId,
    label: noeud.libelle,
    children: noeud.enfants.map(noeudVersReponse),
  };
}
