/**
 * Entité de domaine pure. Reflète "CatalogueActionsCoins" du cahier de
 * conception, module 6 — catalogue de référence, alimenté au démarrage avec
 * les actions réelles listées dans le cahier des charges §5.3.
 */
export class CatalogueActionsCoins {
  private constructor(
    public readonly code: string,
    public readonly valeurCoins: number,
    public readonly actif: boolean,
  ) {}

  static depuisPersistance(donnees: { code: string; valeurCoins: number; actif: boolean }): CatalogueActionsCoins {
    return new CatalogueActionsCoins(donnees.code, donnees.valeurCoins, donnees.actif);
  }
}
