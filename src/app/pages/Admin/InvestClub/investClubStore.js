// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { currentAdmin } from "../currentAdmin";
import { getMembersState, listMembers } from "../Membres/membersStore";
import { clubTierOf } from "./tiers";

// ----------------------------------------------------------------------
// Registre du DBC Invest Club, gardé dans le navigateur (localStorage, protégé
// par try/catch, mise à jour entre onglets) en attendant le backend — même
// principe que Membres/membersStore.js.
//
// Le club est réservé aux membres investisseurs : avoir le niveau DBC requis
// ouvre le droit d'y entrer ("éligible"), mais c'est l'administration qui
// ADMET le membre. On ne garde ici que ces admissions :
//   admitted = { [memberId]: { at: "AAAA-MM-JJ", by: "Nom de l'admin" } }
const STORAGE_KEY = "dbc-admin-invest-club-v1";

const todayDate = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Données de départ (démonstration) : un membre éligible et actif sur deux
// est déjà admis, pour que la page ne soit pas vide au premier affichage.
function buildSeed() {
  const admitted = {};
  listMembers(getMembersState())
    .filter((member) => member.status === "actif" && clubTierOf(member.levelKey) > 0)
    .forEach((member, index) => {
      if (index % 2 === 0) admitted[member.id] = { at: member.joinedAt, by: currentAdmin.name };
    });
  return { admitted };
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.admitted === "object") return parsed;
    }
  } catch {
    // stockage indisponible : on repart des données de départ
  }
  return buildSeed();
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

export const getInvestClubState = () => state;

export function useInvestClub() {
  return useSyncExternalStore(subscribe, getInvestClubState, getInvestClubState);
}

function commit(next) {
  state = next;
  save();
  emit();
}

export function admitMember(memberId) {
  if (state.admitted[memberId]) return;
  commit({ admitted: { ...state.admitted, [memberId]: { at: todayDate(), by: currentAdmin.name } } });
}

export function removeMember(memberId) {
  if (!state.admitted[memberId]) return;
  const rest = { ...state.admitted };
  delete rest[memberId];
  commit({ admitted: rest });
}
