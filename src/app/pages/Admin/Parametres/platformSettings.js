// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { enregistrerParametresPlateforme, lireParametresPlateforme } from "api/parametresPlateforme";
import {
  initialBackupSettings,
  initialGeneralSettings,
  initialNotificationMatrix,
  initialNotificationsEnabled,
  initialSecuritySettings,
  initialTontineSettings,
} from "./mockData";

// ----------------------------------------------------------------------
// Réglages de la PLATEFORME choisis par l'admin (Paramètres admin) et lus
// par le reste du site — notamment l'espace membre : règles de mot de
// passe, durée d'inactivité avant déconnexion, jour de cotisation, qui
// reçoit quelles notifications... Avant, la page Paramètres admin gardait
// ces valeurs dans l'état du composant : elles disparaissaient au
// rechargement et rien d'autre ne les lisait.
//
// Enregistrés sur le serveur (GET/PUT /parametres-plateforme), qui est la
// source de vérité et RE-VÉRIFIE la règle de mot de passe (un contrôle fait
// seulement dans le navigateur ne protège rien). Un changement s'affiche
// aussitôt ; il part au serveur après une courte pause (les champs texte
// enregistrent à chaque frappe), et l'état du serveur revient s'il refuse.
const SAVE_DELAY_MS = 600;

// Bornes de la longueur minimale du mot de passe. Jamais en dessous de 8 :
// un mot de passe plus court se devine trop vite.
export const PASSWORD_LENGTH_BOUNDS = { min: 8, max: 32 };
export const MEMBER_IDLE_MINUTES_OPTIONS = [5, 10, 15, 30];

export const defaultPlatformSettings = {
  general: initialGeneralSettings,
  tontine: initialTontineSettings,
  security: initialSecuritySettings,
  backup: initialBackupSettings,
  notificationsEnabled: initialNotificationsEnabled,
  notificationMatrix: initialNotificationMatrix,
};

function merge(saved) {
  const matrix = { ...defaultPlatformSettings.notificationMatrix };
  Object.keys(matrix).forEach((key) => {
    matrix[key] = { ...matrix[key], ...(saved.notificationMatrix?.[key] ?? {}) };
  });
  const security = { ...defaultPlatformSettings.security, ...(saved.security ?? {}) };
  security.passwordMinLength = Math.min(
    PASSWORD_LENGTH_BOUNDS.max,
    Math.max(PASSWORD_LENGTH_BOUNDS.min, Number(security.passwordMinLength) || PASSWORD_LENGTH_BOUNDS.min),
  );
  return {
    general: { ...defaultPlatformSettings.general, ...(saved.general ?? {}) },
    tontine: { ...defaultPlatformSettings.tontine, ...(saved.tontine ?? {}) },
    security,
    backup: { ...defaultPlatformSettings.backup, ...(saved.backup ?? {}) },
    notificationsEnabled: saved.notificationsEnabled ?? defaultPlatformSettings.notificationsEnabled,
    notificationMatrix: matrix,
  };
}

let state = merge({});
const listeners = new Set();
let saveTimer = null;

function emit() {
  listeners.forEach((listener) => listener());
}

// Charge (ou recharge) les réglages depuis le serveur.
export function loadPlatformSettings() {
  return lireParametresPlateforme()
    .then((saved) => {
      if (saveTimer) return; // un changement attend d'être envoyé : il l'emporte
      state = merge(saved ?? {});
      emit();
    })
    .catch(() => {
      // serveur injoignable : on garde les valeurs actuelles
    });
}

loadPlatformSettings();

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    enregistrerParametresPlateforme(state)
      .then((saved) => {
        if (saveTimer) return;
        state = merge(saved);
        emit();
      })
      .catch(() => loadPlatformSettings());
  }, SAVE_DELAY_MS);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPlatformSettings() {
  return state;
}

// "update" : une fonction (état actuel -> nouvel état) ou un objet partiel.
export function updatePlatformSettings(update) {
  const next = typeof update === "function" ? update(state) : { ...state, ...update };
  state = merge(next);
  emit();
  scheduleSave();
}

export function usePlatformSettings() {
  return useSyncExternalStore(subscribe, getPlatformSettings, getPlatformSettings);
}

// Valeurs lues par le reste du site, ramenées dans des bornes sûres : un champ
// vidé ou mal saisi côté admin ne doit pas casser les dates de tontine.
export function getContributionDay(settings = state) {
  const day = Math.round(Number(settings.tontine.contributionDay));
  return Number.isFinite(day) ? Math.min(28, Math.max(1, day)) : 5;
}

export function getReminderDays(settings = state) {
  const days = Math.round(Number(settings.tontine.reminderDaysBefore));
  return Number.isFinite(days) ? Math.min(31, Math.max(0, days)) : 3;
}

// ----------------------------------------------------------------------
// Règle de mot de passe : toujours une lettre, la longueur minimale choisie
// par l'admin, et en option une majuscule, un chiffre, un symbole.

// Les exigences à afficher (dans l'ordre), selon les réglages.
export function passwordRequirements(security) {
  return [
    "letter",
    security.passwordRequireUpper && "upper",
    security.passwordRequireDigit && "digit",
    security.passwordRequireSymbol && "symbol",
  ].filter(Boolean);
}

// Vrai si le mot de passe respecte la règle.
export function isPasswordValid(password, security) {
  if (password.length < security.passwordMinLength) return false;
  const checks = {
    letter: /[A-Za-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  return passwordRequirements(security).every((key) => checks[key]);
}
