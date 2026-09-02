/**
 * Entité de domaine pure. Reflète "ParrainageMlm" du cahier de conception,
 * module 5 — position d'un membre dans l'arbre de parrainage, stockée comme
 * chemin ltree (extension Postgres, déjà activée — docker/init-extensions.sql).
 * Un label ltree ne peut pas contenir de tiret : on retire les tirets de
 * l'UUID du membre pour former son segment.
 */
export function segmentLtree(membreId: string): string {
  return `m${membreId.replace(/-/g, '')}`;
}

export class ParrainageMlm {
  private constructor(
    public readonly id: string | undefined,
    public readonly membreId: string,
    public readonly chemin: string,
    public readonly profondeur: number,
  ) {}

  static creerRacine(membreId: string): ParrainageMlm {
    return new ParrainageMlm(undefined, membreId, segmentLtree(membreId), 0);
  }

  static creerSousParrain(membreId: string, parrain: ParrainageMlm): ParrainageMlm {
    return new ParrainageMlm(undefined, membreId, `${parrain.chemin}.${segmentLtree(membreId)}`, parrain.profondeur + 1);
  }

  static depuisPersistance(donnees: { id: string; membreId: string; chemin: string; profondeur: number }): ParrainageMlm {
    return new ParrainageMlm(donnees.id, donnees.membreId, donnees.chemin, donnees.profondeur);
  }
}
