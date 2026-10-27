// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { personKey } from "app/pages/Annonces/audience";
import { normalizeSearchText } from "../searchUtils";
import { RATING_HOURS, averageOf } from "./priorityScore";

// ----------------------------------------------------------------------
// Ce que le Score de Priorité DBC (voir priorityScore.js) a besoin de retenir,
// gardé dans le navigateur (localStorage, protégé par try/catch, mise à jour
// entre onglets) en attendant le backend. Chaque ligne garde sa date et son
// auteur : c'est la piste d'audit.
//   declarations  { [personne]: { category, description, proof, submittedAt,
//                 status: "pending" | "validated" | "rejected", decidedAt,
//                 decidedBy, note, name } } — l'urgence déclarée par le membre,
//                 avec son justificatif, à valider par le Comité de
//                 Gouvernance sous 72 h ;
//   ratings       { [personne]: { name, sponsorMatricule, sponsorName, requestedAt,
//                 dueAt, reminders: [ISO], aspects, average, ratedAt } } — la
//                 note que le mentor-parrain donne à son filleul : demandée
//                 d'office, à rendre sous 72 h, avec des rappels automatiques ;
//   vetoes        { [personne]: { reason, valid, at, by } } — un éventuel veto ;
//   roles         { [groupe]: { mentorId, cmId } } — le mentor-parrain et le
//                 Community Manager Local du groupe ;
//   swaps         { [groupe]: [{ a, b, aName, bName, at, by }] } — les échanges
//                 de rang (co-signés, validés, définitifs) ;
//   draws         { [groupe]: { order: [ids], at, by } } — le tirage au sort
//                 qui départage des scores égaux ;
//   published     { [groupe]: { at, by, ranks: { [id]: rang } } } — le classement
//                 publié (validé par le Comité Exécutif).
// "personne" : le matricule du membre, ou "name:<nom>" s'il n'en a pas.
const STORAGE_KEY = "dbc-tontine-priority-v1";

const EMPTY = { declarations: {}, ratings: {}, vetoes: {}, roles: {}, swaps: {}, draws: {}, published: {} };

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object") return { ...EMPTY, ...saved };
  } catch {
    // stockage illisible : on repart de zéro
  }
  return EMPTY;
}

let state = load();
const listeners = new Set();

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage plein ou refusé : l'état reste en mémoire
  }
}

const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    emit();
  });
}

export const getPriorityState = () => state;

export function usePriorityStore() {
  return useSyncExternalStore(subscribe, getPriorityState, getPriorityState);
}

function commit(patch) {
  state = { ...state, ...patch };
  save();
  emit();
}

// ----------------------------------------------------------------------
// Lectures (fonctions pures sur un instantané)

export const keyOf = (person) => personKey(person);

// Retrouve l'enregistrement d'une personne : par matricule, par nom, puis en
// comparant les noms (le membre connecté et l'administration ne connaissent pas
// toujours les mêmes identifiants).
function findRecord(map, { matricule, name }) {
  const byMatricule = matricule ? map[personKey({ matricule })] : null;
  if (byMatricule) return byMatricule;
  const byName = name ? map[personKey({ name })] : null;
  if (byName) return byName;
  const wanted = normalizeSearchText(name ?? "");
  return wanted ? (Object.values(map).find((record) => normalizeSearchText(record.name ?? "") === wanted) ?? null) : null;
}

export const lookupFor = (snapshot) => ({
  declarationOf: (person) => findRecord(snapshot.declarations, person),
  ratingOf: (person) => findRecord(snapshot.ratings, person),
  vetoOf: (person) => findRecord(snapshot.vetoes, person),
});

export const pendingDeclarations = (snapshot) =>
  Object.entries(snapshot.declarations)
    .filter(([, record]) => record.status === "pending")
    .map(([key, record]) => ({ key, ...record }))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

export const decidedDeclarations = (snapshot) =>
  Object.entries(snapshot.declarations)
    .filter(([, record]) => record.status !== "pending")
    .map(([key, record]) => ({ key, ...record }))
    .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""));

// ----------------------------------------------------------------------
// Écritures

const nowIso = () => new Date().toISOString();

// Le membre déclare son urgence (ou la remplace tant qu'elle n'est pas validée).
export function submitDeclaration(person, { category, description, proof }) {
  const key = personKey(person);
  if (!key) return;
  commit({
    declarations: {
      ...state.declarations,
      [key]: {
        name: person.name,
        category,
        description: String(description ?? "").trim(),
        proof: proof ?? null,
        submittedAt: nowIso(),
        status: "pending",
        decidedAt: null,
        decidedBy: null,
        note: "",
      },
    },
  });
}

// Le Comité de Gouvernance valide (avec la catégorie retenue, qui peut être
// plus basse que celle déclarée) ou refuse.
export function decideDeclaration(key, { status, category, note, by }) {
  const record = state.declarations[key];
  if (!record) return;
  commit({
    declarations: {
      ...state.declarations,
      [key]: {
        ...record,
        status,
        category: category ?? record.category,
        note: String(note ?? "").trim(),
        decidedAt: nowIso(),
        decidedBy: by,
      },
    },
  });
}

// Demande la note du parrain pour un filleul (une seule fois par filleul).
export function requestRating(person, sponsor) {
  const key = personKey(person);
  if (!key || state.ratings[key]) return null;
  const now = Date.now();
  const record = {
    name: person.name,
    sponsorMatricule: sponsor.matricule,
    sponsorName: sponsor.name,
    requestedAt: new Date(now).toISOString(),
    dueAt: new Date(now + RATING_HOURS * 3600 * 1000).toISOString(),
    reminders: [],
    aspects: null,
    average: null,
    ratedAt: null,
  };
  commit({ ratings: { ...state.ratings, [key]: record } });
  return record;
}

export function addRatingReminder(key) {
  const record = state.ratings[key];
  if (!record) return;
  commit({ ratings: { ...state.ratings, [key]: { ...record, reminders: [...record.reminders, new Date().toISOString()] } } });
}

// Le parrain rend sa note : "aspects" = { reliability, commitment, teamwork, integrity }.
export function submitRating(key, aspects) {
  const record = state.ratings[key];
  const average = averageOf(aspects);
  if (!record || average == null) return;
  commit({ ratings: { ...state.ratings, [key]: { ...record, aspects, average, ratedAt: new Date().toISOString() } } });
}

// L'administration redonne 72 h au parrain.
export function extendRating(key) {
  const record = state.ratings[key];
  if (!record || record.average != null) return;
  commit({
    ratings: {
      ...state.ratings,
      [key]: { ...record, dueAt: new Date(Date.now() + RATING_HOURS * 3600 * 1000).toISOString(), reminders: [] },
    },
  });
}

export function setVeto(person, veto, by) {
  const key = personKey(person);
  if (!key) return;
  const next = { ...state.vetoes };
  if (veto) next[key] = { ...veto, at: nowIso(), by };
  else delete next[key];
  commit({ vetoes: next });
}

export function setRoles(groupId, roles) {
  commit({ roles: { ...state.roles, [groupId]: { ...state.roles[groupId], ...roles } } });
}

export function addSwap(groupId, swap, by) {
  const list = state.swaps[groupId] ?? [];
  commit({ swaps: { ...state.swaps, [groupId]: [...list, { ...swap, at: nowIso(), by }] } });
}

export function setDraw(groupId, order, by) {
  commit({ draws: { ...state.draws, [groupId]: { order, at: nowIso(), by } } });
}

export function publishRanking(groupId, ranks, by) {
  commit({ published: { ...state.published, [groupId]: { at: nowIso(), by, ranks } } });
}
