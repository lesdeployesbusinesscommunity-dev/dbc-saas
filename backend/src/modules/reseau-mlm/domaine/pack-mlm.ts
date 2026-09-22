/**
 * Entité de domaine pure. Reflète "PackMlm" du cahier de conception, module 5
 * — catalogue de référence, alimenté au démarrage avec les 6 vrais packs
 * Longrich (cahier des charges §5.2).
 */
export const TYPES_GAINS_PACK = ['parrainage_seul', 'performance'] as const;
export type TypeGainsPack = (typeof TYPES_GAINS_PACK)[number];

export class PackMlm {
  private constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly nom: string,
    public readonly prix: number,
    public readonly pointsPv: number,
    public readonly niveauRequisCode: string,
    public readonly typeGains: TypeGainsPack,
  ) {}

  static depuisPersistance(donnees: {
    id: number;
    code: string;
    nom: string;
    prix: number;
    pointsPv: number;
    niveauRequisCode: string;
    typeGains: TypeGainsPack;
  }): PackMlm {
    return new PackMlm(
      donnees.id,
      donnees.code,
      donnees.nom,
      donnees.prix,
      donnees.pointsPv,
      donnees.niveauRequisCode,
      donnees.typeGains,
    );
  }
}
