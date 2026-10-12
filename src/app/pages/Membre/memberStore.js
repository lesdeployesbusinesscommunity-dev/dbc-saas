// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { getMemberSpace } from "api/espaceMembre";
import { getMyTontine } from "api/tontine";
import { listerPacks } from "api/reseauMlm";
import { levels } from "app/pages/Simulateur/data";
import { getSessionSnapshot, subscribeSession } from "app/pages/Auth/session";
import { LEVEL_CODE_BY_KEY, levelKeyFromCode } from "utils/levelCodes";

// ----------------------------------------------------------------------
// Données de l'espace membre, chargées depuis l'API pour le compte connecté :
// GET /espace-membre (profil, Coins, réseau, MLM, activité), le catalogue des
// packs Longrich, puis, pour chaque niveau où le membre cotise,
// GET /tontine/ma-tontine. Les modules de chaque
// page (currentMember.js, accountData.js, Tontine/mockData.js...) lisent cet
// état de façon synchrone et gardent EXACTEMENT les formes de données que les
// composants attendaient : les pages n'ont pas à changer.
//
// MembreLayout.jsx lance le chargement et n'affiche l'espace qu'une fois les
// données là ; chaque page appelle useMemberData() pour se redessiner quand
// elles changent (après un paiement, une modification de profil...).
const initialState = { status: "idle", space: null, tontineByLevel: {}, packs: [], error: null, version: 0 };
let state = initialState;
const listeners = new Set();

function set(patch) {
  state = { ...state, ...patch, version: state.version + 1 };
  listeners.forEach((listener) => listener());
}

export function subscribeMemberStore(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMemberStore() {
  return state;
}

export function useMemberData() {
  return useSyncExternalStore(subscribeMemberStore, getMemberStore, getMemberStore);
}

const levelRank = (key) => levels.findIndex((level) => level.key === key);

// Les niveaux du membre (clés frontend), du plus bas au plus haut : ceux où il
// a une vague en cours ou attend la prochaine, et toujours son niveau
// d'adhésion (même sans vague encore, pour qu'il puisse la rejoindre).
export function memberLevelKeys(space = state.space) {
  if (!space) return [];
  const codes = [
    ...space.levels.activeLevelCodes,
    ...space.levels.waitingLevelCodes,
    space.levels.membershipLevelCode,
  ].filter(Boolean);
  return [...new Set(codes.map(levelKeyFromCode))].sort((a, b) => levelRank(a) - levelRank(b));
}

let inflight = null;

// Charge (ou recharge) tout l'espace. Les appels simultanés partagent le même
// chargement.
export function loadMemberSpace() {
  if (inflight) return inflight;
  set({ status: state.space ? "refreshing" : "loading" });
  inflight = (async () => {
    try {
      const [space, packs] = await Promise.all([getMemberSpace(), listerPacks()]);
      const keys = memberLevelKeys(space);
      const entries = await Promise.all(
        keys.map(async (key) => [key, await getMyTontine(LEVEL_CODE_BY_KEY[key] ?? key)]),
      );
      set({ status: "ready", space, packs, tontineByLevel: Object.fromEntries(entries), error: null });
    } catch (error) {
      set({ status: state.space ? "ready" : "error", error });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// Un autre compte se connecte (ou la session se ferme) : on oublie les
// données du compte précédent pour ne jamais les montrer au suivant.
let loadedFor = getSessionSnapshot().session?.user?.id ?? null;
subscribeSession(() => {
  const userId = getSessionSnapshot().session?.user?.id ?? null;
  if (userId !== loadedFor) {
    loadedFor = userId;
    state = { ...initialState, version: state.version + 1 };
    listeners.forEach((listener) => listener());
  }
});
