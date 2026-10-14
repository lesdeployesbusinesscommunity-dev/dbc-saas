/** "membre" : fil de l'espace membre ; "admin" : fil de l'espace administrateur. */
export type AudienceNotification = 'membre' | 'admin';

/**
 * Notifications DÉDUITES (rappels de cotisation, formations, Coins...) déjà
 * lues par un utilisateur. Elles ne sont pas enregistrées — elles se
 * recalculent à partir des données — : seul leur identifiant l'est, une fois lu.
 */
export abstract class LectureNotificationRepositoryPort {
  abstract listerCles(utilisateurId: string, audience: AudienceNotification): Promise<string[]>;
  abstract ajouter(utilisateurId: string, audience: AudienceNotification, cles: string[]): Promise<void>;
}
