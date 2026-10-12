import { Injectable, Logger } from '@nestjs/common';
import { NotificationTontine, TypeNotificationTontine } from '../domaine/notification-tontine';
import { NotificationTontineRepositoryPort } from '../domaine/notification-tontine.repository.port';
import { NotificateurTontinePort } from '../domaine/notificateur-tontine.port';

export interface NotifierMembreCommande {
  destinataireMembreId: string;
  groupeId: string;
  type: TypeNotificationTontine;
  message: string;
}

/**
 * Enregistre la notification (tableau de bord du destinataire) puis la pousse
 * sur WhatsApp. Un échec d'envoi WhatsApp ne fait jamais échouer l'opération
 * métier : la notification reste visible dans l'application.
 */
@Injectable()
export class NotifierMembreTontineService {
  private readonly logger = new Logger(NotifierMembreTontineService.name);

  constructor(
    private readonly notifications: NotificationTontineRepositoryPort,
    private readonly notificateur: NotificateurTontinePort,
  ) {}

  async executer(commande: NotifierMembreCommande): Promise<void> {
    await this.notifications.sauvegarder(NotificationTontine.creer(commande));
    try {
      await this.notificateur.envoyer(commande.destinataireMembreId, commande.message);
    } catch (erreur) {
      this.logger.warn(`Notification WhatsApp non envoyée à ${commande.destinataireMembreId} : ${(erreur as Error).message}`);
    }
  }
}
