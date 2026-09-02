import { Injectable, Logger } from '@nestjs/common';
import { FournisseurPaiementPort } from '../domaine/fournisseur-paiement.port';

/**
 * Adaptateur TEMPORAIRE de développement — aucun appel réseau réel.
 * À REMPLACER par un adaptateur vers un vrai fournisseur Mobile Money
 * (MTN Mobile Money, Orange Money...) une fois les identifiants disponibles ;
 * aucune ligne du domaine ni de l'application n'aura besoin de changer.
 *
 * En dev, le callback (POST /paiements/webhook) doit être déclenché manuellement
 * pour simuler la confirmation du fournisseur.
 */
@Injectable()
export class FournisseurPaiementSimule implements FournisseurPaiementPort {
  private readonly logger = new Logger(FournisseurPaiementSimule.name);

  async initier(params: {
    montant: number;
    objet: string;
    telephone: string;
    cleIdempotence: string;
  }): Promise<void> {
    this.logger.log(
      `[SIMULÉ] Paiement initié : ${params.montant} FCFA pour "${params.objet}" ` +
        `(${params.telephone}, clé=${params.cleIdempotence}) — ` +
        `déclenchez POST /paiements/webhook pour simuler la confirmation.`,
    );
  }
}
