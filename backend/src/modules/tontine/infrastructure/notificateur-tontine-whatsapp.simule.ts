import { Injectable, Logger } from '@nestjs/common';
import { NotificateurTontinePort } from '../domaine/notificateur-tontine.port';

/**
 * Adaptateur TEMPORAIRE de développement — aucun appel à l'API WhatsApp
 * Business réelle, comme EnvoyeurOtpWhatsAppSimule (Identité & accès). À
 * REMPLACER une fois les identifiants disponibles (cahier des charges §10.3) ;
 * aucune ligne du domaine ni de l'application n'aura besoin de changer.
 */
@Injectable()
export class NotificateurTontineWhatsAppSimule implements NotificateurTontinePort {
  private readonly logger = new Logger(NotificateurTontineWhatsAppSimule.name);

  async envoyer(membreId: string, message: string): Promise<void> {
    this.logger.log(`[SIMULÉ] WhatsApp au membre ${membreId} : ${message}`);
  }
}
