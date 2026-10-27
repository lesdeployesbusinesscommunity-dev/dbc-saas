// Import Dependencies
import { useSyncExternalStore } from "react";

// ----------------------------------------------------------------------
// Journal des RELANCES envoyées par le leader à ses membres en retard de
// cotisation : seulement "qui, quand, par quel canal", pour qu'il voie qu'il
// a déjà relancé quelqu'un (et ne le relance pas trois fois dans la même
// journée). Le site ne l'envoie pas lui-même : il prépare le message et
// ouvre WhatsApp ou la messagerie, le leader appuie sur "Envoyer". Gardé
// dans le navigateur (localStorage, protégé par try/catch) en attendant le
// backend.
const STORAGE_KEY = "dbc-leader-reminders-v1";

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
  } catch {
    // stockage illisible : on repart d'un journal vide
  }
  return {};
}

let state = typeof window === "undefined" ? {} : load();
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getState = () => state;

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    listeners.forEach((listener) => listener());
  });
}

// { [clé du membre]: { at, channel, count } }
export function useReminders() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function logReminder(memberKey, channel) {
  const previous = state[memberKey];
  state = {
    ...state,
    [memberKey]: { at: new Date().toISOString(), channel, count: (previous?.count ?? 0) + 1 },
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : le journal reste valable pour cette session
  }
  listeners.forEach((listener) => listener());
}
