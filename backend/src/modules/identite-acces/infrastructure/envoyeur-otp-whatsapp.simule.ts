import { Injectable, Logger } from '@nestjs/common';
import { EnvoyeurOtpPort } from '../domaine/envoyeur-otp.port';

/**
 * Adaptateur TEMPORAIRE de développement — aucun appel à l'API WhatsApp
 * Business réelle. À REMPLACER une fois les identifiants disponibles
 * (WHATSAPP_TOKEN, WHATSAPP_PHONE_ID — cahier des charges §10.3) ; aucune
 * ligne du domaine ni de l'application n'aura besoin de changer.
 */
@Injectable()
export class EnvoyeurOtpWhatsAppSimule implements EnvoyeurOtpPort {
  private readonly logger = new Logger(EnvoyeurOtpWhatsAppSimule.name);

  async envoyer(telephone: string, code: string): Promise<void> {
    this.logger.log(`[SIMULÉ] Code OTP WhatsApp envoyé à ${telephone} : ${code} (valide 5 min)`);
  }
}
