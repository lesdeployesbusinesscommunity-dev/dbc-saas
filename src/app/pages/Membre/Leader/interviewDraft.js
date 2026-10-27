// ----------------------------------------------------------------------
// Brouillon du compte-rendu, gardé dans le navigateur (localStorage, protégé
// par try/catch) : si le leader quitte la page entre deux appels, ses coches
// sont encore là à son retour. Effacé quand le compte-rendu est envoyé.
import { emptyDraft } from "./interviewModel";

const STORAGE_KEY = "dbc-leader-drafts-v1";

function readAll() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
  } catch {
    // stockage illisible : pas de brouillon
  }
  return {};
}

function writeAll(all) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // stockage indisponible : le brouillon reste valable tant que la page est ouverte
  }
}

export function loadDraft(registrationId) {
  const saved = readAll()[registrationId];
  return saved ? { ...emptyDraft(), ...saved } : emptyDraft();
}

export function saveDraft(registrationId, draft) {
  writeAll({ ...readAll(), [registrationId]: draft });
}

export function clearDraft(registrationId) {
  const all = readAll();
  delete all[registrationId];
  writeAll(all);
}
