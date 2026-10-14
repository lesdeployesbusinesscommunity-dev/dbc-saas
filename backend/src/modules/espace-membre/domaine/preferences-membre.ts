/**
 * Préférences d'un membre (Paramètres de l'espace membre) : quelles
 * notifications il reçoit et par quel canal, et ce que les autres membres
 * voient de lui. La confidentialité est appliquée par le serveur : ce qu'un
 * membre cache n'est pas envoyé aux autres.
 */
export interface Confidentialite {
  /** Son nom et ses Coins dans le classement DBC Coins. */
  showInLeaderboard: boolean;
  /** Sa fiche "CV" (profession, contacts) visible depuis le classement et Mon Réseau. */
  showCv: boolean;
  showWhatsapp: boolean;
  showCity: boolean;
}

export interface PreferencesMembre {
  notificationsEnabled: boolean;
  /** { typeDeNotification: { email, whatsapp } } */
  notifications: Record<string, Record<string, boolean>>;
  privacy: Confidentialite;
}

const TYPES_NOTIFICATION = ['cotisation', 'tontineTurn', 'referral', 'coins', 'formation', 'community'];
const CANAUX = ['email', 'whatsapp'];

export const PREFERENCES_PAR_DEFAUT: PreferencesMembre = {
  notificationsEnabled: true,
  notifications: {
    cotisation: { email: true, whatsapp: true },
    tontineTurn: { email: true, whatsapp: true },
    referral: { email: true, whatsapp: false },
    coins: { email: true, whatsapp: false },
    formation: { email: true, whatsapp: false },
    community: { email: false, whatsapp: false },
  },
  privacy: { showInLeaderboard: true, showCv: true, showWhatsapp: true, showCity: true },
};

const objet = (valeur: unknown): Record<string, unknown> =>
  valeur && typeof valeur === 'object' && !Array.isArray(valeur) ? (valeur as Record<string, unknown>) : {};
const booleen = (valeur: unknown, defaut: boolean) => (typeof valeur === 'boolean' ? valeur : defaut);

/** Complète avec les valeurs par défaut et ne garde que les champs connus. */
export function normaliserPreferences(brut: unknown): PreferencesMembre {
  const d = PREFERENCES_PAR_DEFAUT;
  const racine = objet(brut);
  const notifications = objet(racine.notifications);
  const confidentialite = objet(racine.privacy);
  return {
    notificationsEnabled: booleen(racine.notificationsEnabled, d.notificationsEnabled),
    notifications: Object.fromEntries(
      TYPES_NOTIFICATION.map((type) => {
        const ligne = objet(notifications[type]);
        return [type, Object.fromEntries(CANAUX.map((c) => [c, booleen(ligne[c], d.notifications[type][c])]))];
      }),
    ),
    privacy: {
      showInLeaderboard: booleen(confidentialite.showInLeaderboard, d.privacy.showInLeaderboard),
      showCv: booleen(confidentialite.showCv, d.privacy.showCv),
      showWhatsapp: booleen(confidentialite.showWhatsapp, d.privacy.showWhatsapp),
      showCity: booleen(confidentialite.showCity, d.privacy.showCity),
    },
  };
}
