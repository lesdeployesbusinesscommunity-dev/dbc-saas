// Import Dependencies
import { useSyncExternalStore } from "react";

// ----------------------------------------------------------------------
// Session de connexion, ouverte par POST /auth/login (voir Auth/index.jsx).
//
// Volontairement gardée EN MÉMOIRE SEULEMENT — jamais dans localStorage,
// sessionStorage ou un cookie lisible par la page : actualiser la page (F5),
// fermer l'onglet ou la rouvrir fait perdre la session, et il faut se
// reconnecter. C'est le comportement voulu pour un espace qui contient des
// informations sensibles. Naviguer d'une page à l'autre DANS l'espace
// (sans actualiser) garde la session, donc l'usage normal n'est pas gêné.
//
// La session porte le jeton d'accès renvoyé par le backend (joint à chaque
// appel par api/httpClient.js, renouvelé tant que l'espace est ouvert — voir
// SessionGuard.jsx) et le profil de l'utilisateur ("user" : nom, matricule,
// niveau, rôle...).
//
// L'état garde aussi "endReason" (pourquoi la dernière session s'est
// terminée : "expired", "logout"...) pour que la page de connexion affiche
// le bon message.
let state = { session: null, endReason: null };
const listeners = new Set();

function set(next) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getState = () => state;

// Pour le code hors composant (ex : Membre/currentMember.js, qui change de
// profil quand un autre compte se connecte).
export function getSessionSnapshot() {
  return state;
}

export function subscribeSession(listener) {
  return subscribe(listener);
}

export function useSessionState() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useSession() {
  return useSessionState().session;
}

// role : "membre" ou "admin" (l'espace ouvert). "canSwitchRole" : le compte
// peut passer d'un espace à l'autre sans se reconnecter — c'est le cas d'un
// administrateur (rôle "admin" côté serveur), qui est d'abord un membre (voir
// switchSessionRole).
export function startSession({ role, name, canSwitchRole = false, accessToken = null, user = null }) {
  set({
    session: { role, name, canSwitchRole, accessToken, user, startedAt: Date.now() },
    endReason: null,
  });
}

// Pour api/httpClient.js : le jeton à joindre aux appels (null hors session).
export function getAccessToken() {
  return state.session?.accessToken ?? null;
}

// Jeton renouvelé (POST /auth/refresh) : la session continue avec le nouveau.
export function setAccessToken(accessToken) {
  if (!state.session) return;
  set({ ...state, session: { ...state.session, accessToken } });
}

// Profil mis à jour (ex : Paramètres > Profil) sans rouvrir la session.
export function updateSessionUser(user) {
  if (!state.session) return;
  set({ ...state, session: { ...state.session, user } });
}

// Passe la session en cours d'un espace à l'autre ("membre" <-> "admin")
// sans nouvelle connexion : un administrateur est d'abord un membre, donc
// il garde les deux accès. Sans effet (renvoie false) pour un compte qui n'a
// pas ce droit — un simple membre ne peut jamais devenir administrateur par
// ce chemin. Le droit vient du rôle renvoyé par le serveur à la connexion, et
// le serveur revérifie ce rôle sur chaque appel admin.
export function switchSessionRole(role) {
  if (!state.session?.canSwitchRole) return false;
  set({ ...state, session: { ...state.session, role } });
  return true;
}

// reason : "logout" (bouton Se déconnecter) ou "expired" (inactivité).
export function endSession(reason = "logout") {
  if (!state.session) return;
  set({ session: null, endReason: reason });
}

// ----------------------------------------------------------------------
// Limite des tentatives de connexion : après 5 mauvaises tentatives de
// suite, le formulaire se bloque 30 s, puis 60 s, 2 min... (plafonné à
// 5 min). Une connexion réussie remet tout à zéro. Ce n'est qu'un garde-fou
// côté navigateur — la vraie limite devra aussi exister côté serveur.
const MAX_FAILURES = 5;
const BASE_LOCK_MS = 30 * 1000;
const MAX_LOCK_MS = 5 * 60 * 1000;

let failures = 0;
let lockLevel = 0;
let lockedUntil = 0;

// Secondes restantes avant de pouvoir réessayer (0 = pas bloqué).
export function getLockRemaining() {
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
}

export function recordFailure() {
  failures += 1;
  if (failures >= MAX_FAILURES) {
    lockLevel += 1;
    lockedUntil = Date.now() + Math.min(BASE_LOCK_MS * 2 ** (lockLevel - 1), MAX_LOCK_MS);
    failures = 0;
  }
}

export function recordSuccess() {
  failures = 0;
  lockLevel = 0;
  lockedUntil = 0;
}
