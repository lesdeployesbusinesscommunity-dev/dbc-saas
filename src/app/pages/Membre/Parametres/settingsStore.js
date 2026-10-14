// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { enregistrerPreferences, lirePreferences } from "api/espaceMembre";
import { getSessionSnapshot } from "app/pages/Auth/session";

// ----------------------------------------------------------------------
// Préférences du membre : notifications et confidentialité. Enregistrées sur
// le serveur, par compte (GET/PUT /espace-membre/preferences), qui applique
// la confidentialité aux autres membres. "loadSettings" renvoie la dernière
// version connue (les valeurs par défaut tant que le serveur n'a pas
// répondu) ; "useMemberSettings" redessine quand elle arrive.
//
// Le profil (nom, photo, coordonnées) n'est PAS ici : il vit dans
// currentMember.js ("applyProfile"), parce que le reste de l'espace membre
// le lit.

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

function merge(saved = {}) {
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

let cache = { userId: null, settings: merge() };
let requested = null;
const listeners = new Set();

const sessionUserId = () => getSessionSnapshot().session?.user?.id ?? null;

function publish(userId, settings) {
  cache = { userId, settings };
  listeners.forEach((listener) => listener());
}

function fetchSettings(userId) {
  requested = userId;
  lirePreferences()
    .then((saved) => {
      if (sessionUserId() === userId) publish(userId, merge(saved));
    })
    .catch(() => {
      // serveur injoignable : on garde les valeurs par défaut
    });
}

// Préférences du compte connecté (les valeurs par défaut d'abord, puis
// celles du serveur).
export function loadSettings() {
  const userId = sessionUserId();
  if (cache.userId !== userId) cache = { userId, settings: merge() };
  if (userId && requested !== userId) fetchSettings(userId);
  return cache.settings;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMemberSettings() {
  return useSyncExternalStore(subscribe, loadSettings, loadSettings);
}

export function saveSettings(settings) {
  const userId = sessionUserId();
  publish(userId, settings);
  if (!userId) return;
  enregistrerPreferences(settings)
    .then((saved) => publish(userId, merge(saved)))
    .catch(() => fetchSettings(userId));
}
