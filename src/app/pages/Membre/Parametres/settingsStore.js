// ----------------------------------------------------------------------
// Préférences du membre : notifications et confidentialité. Pas de
// backend pour l'instant : elles sont gardées dans le navigateur
// (localStorage, protégé par try/catch — il peut être absent ou bloqué)
// et réappliquées à l'ouverture de la page. À remplacer par les vrais
// endpoints (préférences enregistrées côté serveur, par membre) sans
// changer la forme de ce que "loadSettings" renvoie.
//
// Le profil (nom, photo, coordonnées) n'est PAS ici : il vit dans
// currentMember.js ("applyProfile"), parce que le reste de l'espace membre
// le lit.
const STORAGE_KEY = "dbc-membre-settings-v1";

// Types de notification proposés, avec le canal (email / WhatsApp) par
// lequel les recevoir. Les rappels d'échéance de cotisation sont activés
// par défaut sur les deux canaux : un membre qui oublie de cotiser est
// pénalisé (tour de tontine, Coins), mieux vaut qu'il soit prévenu.
export const notificationTypes = [
  "cotisation",
  "tontineTurn",
  "referral",
  "coins",
  "formation",
  "community",
];

export const notificationChannels = ["email", "whatsapp"];

export const defaultSettings = {
  notificationsEnabled: true,
  notifications: {
    cotisation: { email: true, whatsapp: true },
    tontineTurn: { email: true, whatsapp: true },
    referral: { email: true, whatsapp: false },
    coins: { email: true, whatsapp: false },
    formation: { email: true, whatsapp: false },
    community: { email: false, whatsapp: false },
  },
  // Ce que les AUTRES membres voient de moi (classement, fiche "CV",
  // Mon Réseau). Enregistré dès maintenant ; les autres membres n'étant
  // pas de vraies personnes tant que le backend n'est pas branché, ces
  // choix prendront effet à ce moment-là.
  privacy: {
    showInLeaderboard: true,
    showCv: true,
    showWhatsapp: true,
    showCity: true,
  },
  deletionRequested: false,
};

export function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    saved = {};
  }

  return {
    ...defaultSettings,
    ...saved,
    notifications: Object.fromEntries(
      notificationTypes.map((type) => [
        type,
        { ...defaultSettings.notifications[type], ...(saved.notifications?.[type] ?? {}) },
      ]),
    ),
    privacy: { ...defaultSettings.privacy, ...(saved.privacy ?? {}) },
  };
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // stockage indisponible : les réglages restent valables pour cette session
  }
}
