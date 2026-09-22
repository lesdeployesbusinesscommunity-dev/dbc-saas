import { JournalAudit } from './journal-audit';

export abstract class JournalAuditRepositoryPort {
  abstract enregistrer(entree: JournalAudit): Promise<JournalAudit>;
  abstract lister(limite: number): Promise<JournalAudit[]>;
}
