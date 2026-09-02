import { Injectable } from '@nestjs/common';
import { JournalAudit } from '../domaine/journal-audit';
import { JournalAuditRepositoryPort } from '../domaine/journal-audit.repository.port';

export interface EnregistrerAuditCommande {
  action: string;
  typeEntite: string;
  acteurId: string | null;
  metadonnees?: Record<string, unknown>;
}

/**
 * Point d'entrée unique pour la responsabilité transverse du cahier de
 * conception : "toute mutation d'état sensible dans les autres modules
 * génère systématiquement une entrée dans JournalAudit". Exporté pour être
 * appelé par les autres modules à chaque action admin sensible.
 */
@Injectable()
export class EnregistrerAuditUseCase {
  constructor(private readonly journal: JournalAuditRepositoryPort) {}

  async executer(commande: EnregistrerAuditCommande): Promise<JournalAudit> {
    return this.journal.enregistrer(
      JournalAudit.creer({
        action: commande.action,
        typeEntite: commande.typeEntite,
        acteurId: commande.acteurId,
        metadonnees: commande.metadonnees,
      }),
    );
  }
}
