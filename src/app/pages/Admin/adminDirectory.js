// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { listerMembres } from "api/membres";
import { memberFromApi } from "./Membres/membersApi";

// ----------------------------------------------------------------------
// Annuaire des membres pour les pages admin qui en choisissent ou en
// affichent (Gestion du réseau, Gouvernance...) : les membres réels
// (GET /membres), dans la forme de "Gestion des membres". "adminMembers"
// reste LE MÊME tableau (son contenu est remplacé au chargement) pour que les
// modules qui l'importent lisent toujours la liste à jour.
export const adminMembers = [];

let version = 0;
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getVersion = () => version;

// Se redessiner quand l'annuaire est (re)chargé.
export function useAdminDirectory() {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

export async function loadAdminDirectory() {
  const members = (await listerMembres()).map(memberFromApi);
  adminMembers.splice(0, adminMembers.length, ...members);
  version += 1;
  listeners.forEach((listener) => listener());
}

export function getAdminMember(id) {
  return adminMembers.find((member) => member.id === id) ?? null;
}
