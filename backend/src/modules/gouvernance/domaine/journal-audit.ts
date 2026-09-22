/**
 * Entité de domaine pure. Reflète "JournalAudit" du cahier de conception,
 * module 10 — responsabilité transverse : toute mutation d'état sensible
 * dans les autres modules écrit une entrée ici. Registre en ajout seul,
 * comme TransactionCoins (module 6) : jamais modifié ni supprimé.
 */
export class JournalAudit {
  private constructor(
    public readonly id: string | undefined,
    public readonly action: string,
    public readonly typeEntite: string,
    public readonly acteurId: string | null,
    public readonly metadonnees: Record<string, unknown>,
  ) {}

  static creer(params: {
    action: string;
    typeEntite: string;
    acteurId: string | null;
    metadonnees?: Record<string, unknown>;
  }): JournalAudit {
    return new JournalAudit(undefined, params.action, params.typeEntite, params.acteurId, params.metadonnees ?? {});
  }

  static depuisPersistance(donnees: {
    id: string;
    action: string;
    typeEntite: string;
    acteurId: string | null;
    metadonnees: Record<string, unknown>;
  }): JournalAudit {
    return new JournalAudit(donnees.id, donnees.action, donnees.typeEntite, donnees.acteurId, donnees.metadonnees);
  }
}
