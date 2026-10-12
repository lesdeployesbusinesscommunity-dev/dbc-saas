/**
 * Port vers le canal qui prévient un membre hors de l'application (WhatsApp,
 * cahier des charges §2.4). L'adaptateur retrouve lui-même le numéro du
 * membre : le domaine ne manipule que des identifiants.
 */
export abstract class NotificateurTontinePort {
  abstract envoyer(membreId: string, message: string): Promise<void>;
}
