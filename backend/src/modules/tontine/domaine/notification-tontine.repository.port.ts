import { NotificationTontine } from './notification-tontine';

export abstract class NotificationTontineRepositoryPort {
  abstract sauvegarder(notification: NotificationTontine): Promise<NotificationTontine>;
  abstract trouverParId(id: string): Promise<NotificationTontine | null>;
  /** Notifications d'un membre, les plus récentes d'abord. */
  abstract listerParDestinataire(membreId: string): Promise<NotificationTontine[]>;
}
