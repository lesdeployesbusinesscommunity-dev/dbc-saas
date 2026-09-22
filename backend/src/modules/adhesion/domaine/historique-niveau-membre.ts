/**
 * Entité de domaine pure. Reflète la classe "HistoriqueNiveauMembre" du cahier
 * de conception, module 2 — composée par Membre : chaque période passée à un
 * niveau donné (y compris le tout premier) donne une entrée.
 */
export class HistoriqueNiveauMembre {
  private constructor(
    public readonly id: string | undefined,
    public readonly membreId: string,
    public readonly niveauId: number,
    public readonly motif: string,
    public readonly debutLe: Date,
    public finLe: Date | null,
  ) {}

  static ouvrir(params: { membreId: string; niveauId: number; motif: string }): HistoriqueNiveauMembre {
    return new HistoriqueNiveauMembre(undefined, params.membreId, params.niveauId, params.motif, new Date(), null);
  }

  static depuisPersistance(donnees: {
    id: string;
    membreId: string;
    niveauId: number;
    motif: string;
    debutLe: Date;
    finLe: Date | null;
  }): HistoriqueNiveauMembre {
    return new HistoriqueNiveauMembre(
      donnees.id,
      donnees.membreId,
      donnees.niveauId,
      donnees.motif,
      donnees.debutLe,
      donnees.finLe,
    );
  }
}
