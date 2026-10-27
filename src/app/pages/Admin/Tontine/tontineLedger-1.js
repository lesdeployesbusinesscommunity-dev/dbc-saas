// Import Dependencies
import { useSyncExternalStore } from "react";

// ----------------------------------------------------------------------
// Ce que l'admin FAIT dans "Gestion des tontines", gardé dans le navigateur
// (localStorage, protégé par try/catch) en attendant le backend, avec une
// mise à jour entre onglets — comme les réglages de la plateforme (voir
// Parametres/platformSettings.js) :
//   - "payouts" : les cagnottes qu'il a versées à leur bénéficiaire ;
//   - "groups"  : les groupes qu'il a créés en plaçant des membres en
//                 attente.
//
// L'admin ne valide JAMAIS la cotisation d'un membre : c'est le paiement du
// membre lui-même qui la fait compter (elle sera confirmée par le service de
// paiement une fois le backend branché). Ce registre ne garde donc aucune
// cotisation.
//
// Clé d'un versement : "<groupe>|<tour>". Valeur : la date (ISO).
const STORAGE_KEY = "dbc-tontine-ledger-v2";

const EMPTY = { payouts: {}, groups: [] };

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      payouts: { ...(saved.payouts ?? {}) },
      groups: Array.isArray(saved.groups) ? saved.groups : [],
    };
  } catch {
    return { payouts: {}, groups: [] };
  }
}

let state = typeof window === "undefined" ? EMPTY : load();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : l'enregistrement reste valable pour cette session
  }
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

const payoutKey = (groupId, tour) => `${groupId}|${tour}`;

export function getTontineLedger() {
  return state;
}

export function useTontineLedger() {
  return useSyncExternalStore(subscribe, getTontineLedger, getTontineLedger);
}

// "ledger" : un instantané (voir useTontineLedger) ; sans lui, l'état actuel.
export function getPayoutDate(groupId, tour, ledger = state) {
  return ledger.payouts[payoutKey(groupId, tour)] ?? null;
}

export function recordPayout(groupId, tour) {
  state = {
    ...state,
    payouts: { ...state.payouts, [payoutKey(groupId, tour)]: new Date().toISOString() },
  };
  save();
  emit();
}

// "group" : { id, levelKey, letter, startMonth ("YYYY-MM-01"), capacity (le
// nombre de places choisi par l'administration), members: [{ id, name, city,
// month ("AAAA-MM") }] } — chaque membre avec le mois où il reçoit la cagnotte.
// Le groupe peut démarrer avec moins de membres que de places.
export function createTontineGroup(group) {
  state = { ...state, groups: [...state.groups, group] };
  save();
  emit();
}

// Place des membres sur des mois libres d'un groupe déjà créé : "members" :
// [{ id, name, city, month }]. Refusé (false) si le groupe n'existe pas, s'il
// est plein, si un mois est hors du cycle ou déjà pris, ou si le membre y est déjà.
export function addMembersToGroup(groupId, members) {
  const group = state.groups.find((item) => item.id === groupId);
  if (!group || !Number.isInteger(group.capacity)) return false;
  const first = group.startMonth.slice(0, 7);
  const months = Array.from({ length: group.capacity }, (_, i) => {
    const date = new Date(`${first}-01T12:00:00`);
    date.setMonth(date.getMonth() + i);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const taken = new Set(group.members.map((member) => member.month));
  const present = new Set(group.members.map((member) => member.id));
  for (const member of members) {
    if (!months.includes(member.month) || taken.has(member.month) || present.has(member.id)) return false;
    taken.add(member.month);
    present.add(member.id);
  }
  state = {
    ...state,
    groups: state.groups.map((item) => (item.id === groupId ? { ...item, members: [...item.members, ...members] } : item)),
  };
  save();
  emit();
  return true;
}
