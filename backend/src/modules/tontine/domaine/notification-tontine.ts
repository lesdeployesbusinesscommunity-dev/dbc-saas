/**
 * Entité de domaine pure. Notification affichée dans le tableau de bord d'un
 * membre (responsable de vague, bénéficiaire…). Elle est aussi poussée hors
 * de l'application via NotificateurTontinePort (WhatsApp).
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const TYPES_NOTIFICATION_TONTINE = ['vague_rejointe', 'cotisation_payee', 'cagnotte_attribuee'] as const;
export type TypeNotificationTontine = (typeof TYPES_NOTIFICATION_TONTINE)[number];

export class NotificationTontine {
  private constructor(
    public readonly id: string | undefined,
    public readonly destinataireMembreId: string,
    public readonly groupeId: string,
    public readonly type: TypeNotificationTontine,
    public readonly message: string,
    public lue: boolean,
    public readonly creeLe: Date,
  ) {}

  static creer(params: {
    destinataireMembreId: string;
    groupeId: string;
    type: TypeNotificationTontine;
    message: string;
  }): NotificationTontine {
    return new NotificationTontine(
      undefined,
      params.destinataireMembreId,
      params.groupeId,
      params.type,
      params.message,
      false,
      new Date(),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    destinataireMembreId: string;
    groupeId: string;
    type: TypeNotificationTontine;
    message: string;
    lue: boolean;
    creeLe: Date;
  }): NotificationTontine {
    return new NotificationTontine(
      donnees.id,
      donnees.destinataireMembreId,
      donnees.groupeId,
      donnees.type,
      donnees.message,
      donnees.lue,
      donnees.creeLe,
    );
  }

  marquerLue(destinataireMembreId: string): ResultatOperation<void> {
    if (destinataireMembreId !== this.destinataireMembreId) {
      return ResultatOperation.echec('Cette notification ne vous est pas destinée');
    }
    this.lue = true;
    return ResultatOperation.ok();
  }
}
