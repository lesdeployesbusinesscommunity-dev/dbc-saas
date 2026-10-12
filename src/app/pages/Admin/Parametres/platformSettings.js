// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
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
// Gardés dans le navigateur (localStorage, protégé par try/catch) en
// attendant le backend, avec une mise à jour entre onglets (un admin et un
// membre ouverts dans deux onglets du même navigateur voient la même
// chose). Une fois les endpoints disponibles, c'est le serveur qui sera la
// source de vérité (et qui devra RE-VÉRIFIER ces règles : un contrôle fait
// seulement dans le navigateur ne protège rien).
const STORAGE_KEY = "dbc-platform-settings-v1";

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

function load() {
  try {
    return merge(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    return merge({});
  }
}

let state = load();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    emit();
  });
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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : les réglages restent valables pour cette session
  }
  emit();
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
