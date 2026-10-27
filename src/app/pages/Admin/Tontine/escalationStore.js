// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { buildFollowUpReport } from "./followUpModel";

// ----------------------------------------------------------------------
// Le JOURNAL de la relance automatique : une ligne par étape déclenchée pour
// un membre en retard, gardée dans le navigateur (localStorage, protégé par
// try/catch, mise à jour entre onglets) en attendant le backend. On n'y
// supprime ni ne modifie rien, sauf pour marquer une tâche "faite" : c'est la
// trace (la "piste d'audit") de ce qui a été fait, quand, et par quel canal.
//
// Une ligne :
//   id          "<groupe>|<mois>|<membre>|<étape>" : unique, ce qui évite de
//               relancer deux fois pour la même étape ;
//   cycleKey    "<groupe>|<mois>|<membre>" : le retard auquel elle se rattache ;
//   step        reminder1, reminder2, cm, mentor, caution, reserve, formal, governance ;
//   memberId, memberName, groupId, levelKey, letter, daysLate, amount, penaltyRate ;
//   at          date de déclenchement (ISO) ;
//   deliveries  [{ channel: "app" | "sms" | "whatsapp", status: "sent" | "queued" }]
//               ("queued" : prêt à partir, en attente du service d'envoi) ;
//   recipients  le nombre de personnes prévenues ;
//   status      "sent" (rien à faire) | "todo" (à faire) | "done" ;
//   doneAt      date où la tâche a été faite ;
//   et, pour l'étape "cm" (l'appel du chef d'antenne, voir followUpModel.js) :
//   assignment  { leaderId, leaderName, nodeId, branchName, location, country,
//               assignedAt } : le chef d'antenne chargé du dossier ;
//   report      son rapport (voir buildFollowUpReport) ; la tâche est "done"
//               dès qu'il a pu joindre le membre.
const STORAGE_KEY = "dbc-tontine-escalation-v1";
const MAX_ENTRIES = 2000;

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.entries)) return { entries: saved.entries };
  } catch {
    // stockage illisible : on repart d'un journal vide
  }
  return { entries: [] };
}

let state = typeof window === "undefined" ? { entries: [] } : load();
const listeners = new Set();

function commit(next) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // stockage indisponible : le journal reste valable pour cette session
  }
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    listeners.forEach((listener) => listener());
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getEscalationLog = () => state;
export const useEscalationLog = () => useSyncExternalStore(subscribe, getEscalationLog, getEscalationLog);

export function addEntries(entries) {
  const known = new Set(state.entries.map((entry) => entry.id));
  const fresh = entries.filter((entry) => !known.has(entry.id));
  if (fresh.length === 0) return;
  commit({ entries: [...fresh, ...state.entries].slice(0, MAX_ENTRIES) });
}

export function completeTask(entryId) {
  commit({
    entries: state.entries.map((entry) =>
      entry.id === entryId && entry.status === "todo" && entry.step !== "cm"
        ? { ...entry, status: "done", doneAt: new Date().toISOString() }
        : entry,
    ),
  });
}

export function updateEntry(entryId, changes) {
  commit({ entries: state.entries.map((entry) => (entry.id === entryId ? { ...entry, ...changes } : entry)) });
}

// Le chef d'antenne remet son rapport. Membre joint : le dossier est terminé.
// Membre injoignable : le dossier reste ouvert, il peut réessayer.
export function submitFollowUpReport(entryId, draft) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry || !entry.assignment) return null;
  const report = buildFollowUpReport(draft, entry.assignment.leaderName, entry.report?.attempts ?? 0);
  updateEntry(entryId, {
    report,
    ...(report.reachable ? { status: "done", doneAt: report.at } : {}),
  });
  return report;
}
