// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import {
  deciderDemande,
  deposerDemande,
  listerNotifications,
  marquerNotificationsLues,
  retirerDemande,
} from "api/notifications";
import { getSessionSnapshot, subscribeSession } from "app/pages/Auth/session";
import { currentMember } from "app/pages/Membre/currentMember";
import { levelKeyFromCode } from "utils/levelCodes";

// ----------------------------------------------------------------------
// Notifications ENREGISTRÉES, partagées par l'espace membre et l'espace
// admin : ce sont celles qui naissent d'une ACTION —
// - une DEMANDE du membre (suppression de compte, niveau sollicité,
//   participation à une rencontre, échange de Coins, suite de tontine) :
//   l'admin la reçoit (audience "admin"), avec le profil du membre, puis la
//   valide ou la refuse ;
// - la DÉCISION de l'admin : le membre en est prévenu (audience "membre").
// Les autres notifications (rappels de cotisation, formations, rencontres,
// Coins...) ne sont pas enregistrées : elles se déduisent des données du
// site (voir feeds.js). Seul leur état "lu" l'est.
//
// Enregistrées sur le serveur (GET /notifications : une demande = une
// ligne, créée par le membre, décidée par l'admin ; voir api/notifications.js).
// Chaque action s'affiche aussitôt, part au serveur, puis la liste est
// rechargée. Elle est aussi rechargée régulièrement tant qu'une page
// l'affiche, pour qu'un admin voie arriver les nouvelles demandes.

// Types de demande. "key" sert à repérer une demande déjà en attente (pas
// de doublon si le membre confirme deux fois).
export const REQUEST_TYPES = ["deleteAccount", "level", "event", "reward", "tontineNext"];

const REFRESH_MS = 60 * 1000;

const empty = () => ({ items: [], readIds: { admin: [], membre: [] } });

let state = empty();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function commit(next) {
  state = next;
  emit();
}

// Profil envoyé par le serveur -> forme de getMemberSnapshot().
function memberFromApi(member = {}) {
  return {
    name: member.name,
    firstName: member.firstName,
    lastName: member.lastName,
    matricule: member.membershipNumber,
    email: member.email,
    whatsapp: member.whatsapp,
    city: member.city,
    country: member.country,
    profession: member.profession,
    levelKeys: (member.levelCodes ?? []).map(levelKeyFromCode).filter(Boolean),
    coins: member.coins,
    sponsoredCount: member.sponsoredCount,
  };
}

// Une demande du serveur -> la demande (fil admin) et, si elle est
// décidée, la décision (fil membre).
function itemsFromApi(request) {
  const member = memberFromApi(request.member);
  const items = [
    {
      id: request.id,
      audience: "admin",
      kind: "request",
      type: request.type,
      status: request.status,
      createdAt: Date.parse(request.createdAt),
      decidedAt: request.decidedAt ? Date.parse(request.decidedAt) : null,
      read: request.readByAdmin,
      member,
      details: request.details ?? {},
    },
  ];
  if (request.status === "validated" || request.status === "refused") {
    items.push({
      id: request.decisionId,
      audience: "membre",
      kind: "decision",
      type: request.type,
      status: request.status,
      requestId: request.id,
      memberMatricule: member.matricule ?? null,
      createdAt: Date.parse(request.decidedAt),
      read: request.decisionReadByMember,
      details: request.details ?? {},
    });
  }
  return items;
}

let loadedFor = null;
let timer = null;

const sessionUserId = () => getSessionSnapshot().session?.user?.id ?? null;

// Charge (ou recharge) les notifications du compte connecté.
export function loadNotifications() {
  const userId = sessionUserId();
  loadedFor = userId;
  if (!userId) {
    commit(empty());
    return Promise.resolve();
  }
  return listerNotifications()
    .then((data) => {
      if (sessionUserId() !== userId) return;
      commit({
        items: data.requests.flatMap(itemsFromApi),
        readIds: { ...empty().readIds, ...(data.readIds ?? {}) },
      });
    })
    .catch(() => {
      // serveur injoignable : on garde la liste actuelle
    });
}

// Un autre compte se connecte (ou la session se termine) : on repart de sa liste.
subscribeSession(() => {
  if (sessionUserId() !== loadedFor && listeners.size > 0) loadNotifications();
});

// Envoie une action au serveur, puis recharge la liste (qu'elle ait réussi
// ou non : en cas de refus, l'écran revient à l'état du serveur).
function send(request) {
  request.catch(() => {}).finally(() => loadNotifications());
}

function subscribe(listener) {
  if (listeners.size === 0) {
    if (loadedFor !== sessionUserId() || state.items.length === 0) loadNotifications();
    timer = setInterval(loadNotifications, REFRESH_MS);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function getNotificationState() {
  return state;
}

export function useNotificationState() {
  return useSyncExternalStore(subscribe, getNotificationState, getNotificationState);
}

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Le profil du membre tel qu'il est AU MOMENT de la demande : c'est ce que
// l'admin voit et ce qui part dans le mail (voir mail.js).
export function getMemberSnapshot() {
  return {
    name: currentMember.name,
    firstName: currentMember.firstName,
    lastName: currentMember.lastName,
    matricule: currentMember.matricule,
    email: currentMember.email,
    whatsapp: currentMember.whatsapp,
    city: currentMember.town ?? currentMember.city,
    country: currentMember.country,
    profession: currentMember.profession,
    levelKeys: [...(currentMember.levelKeys ?? [])],
    coins: currentMember.coins,
    sponsoredCount: currentMember.sponsoredCount,
  };
}

// Cette notification enregistrée concerne-t-elle le membre affiché ? Les
// demandes portent le profil de leur auteur ("member"), les décisions son
// matricule : chaque membre (et l'administrateur en mode membre) ne voit et ne
// retire que les siennes. Une notification sans matricule (enregistrée avant
// cette règle) reste visible de tous.
export function isMine(item) {
  const matricule = item.kind === "decision" ? item.memberMatricule : item.member?.matricule;
  return !matricule || matricule === currentMember.matricule;
}

// Les notifications DÉDUITES déjà lues sont mémorisées par identifiant, sur
// le serveur et pour le compte connecté : ce que l'un a lu n'est pas "lu"
// pour l'autre.
const readKey = (_audience, id) => id;

const sameDetails = (a, b) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

// Le membre envoie une demande : une notification "demande" part chez
// l'admin. Si la même demande est déjà en attente, on ne la double pas.
// "request" : { type, ...détails } (ex : { type: "level", levelKey }).
export function submitRequest({ type, ...details }) {
  const existing = state.items.find(
    (item) =>
      item.audience === "admin" &&
      item.kind === "request" &&
      isMine(item) &&
      item.type === type &&
      item.status === "pending" &&
      sameDetails(item.details, details),
  );
  if (existing) return existing.id;

  const item = {
    id: newId("req"),
    audience: "admin",
    kind: "request",
    type,
    status: "pending",
    createdAt: Date.now(),
    decidedAt: null,
    read: false,
    member: getMemberSnapshot(),
    details,
  };
  commit({ ...state, items: [item, ...state.items] });
  send(deposerDemande(type, details));
  return item.id;
}

// Le membre retire sa demande en attente (ex : "Annuler ma demande" de
// suppression de compte). L'admin la voit passer à "retirée".
export function withdrawRequest(type) {
  let changed = false;
  const items = state.items.map((item) => {
    if (item.kind === "request" && isMine(item) && item.type === type && item.status === "pending") {
      changed = true;
      return { ...item, status: "withdrawn", decidedAt: Date.now(), read: false };
    }
    return item;
  });
  if (changed) {
    commit({ ...state, items });
    send(retirerDemande(type));
  }
}

// L'admin valide ou refuse une demande ("validated" | "refused") : le
// membre reçoit une notification de décision.
export function decideRequest(id, status) {
  const target = state.items.find((item) => item.id === id);
  if (!target || target.status !== "pending") return;
  const now = Date.now();
  const decision = {
    id: newId("dec"),
    audience: "membre",
    kind: "decision",
    type: target.type,
    status,
    requestId: id,
    memberMatricule: target.member?.matricule ?? null,
    createdAt: now,
    read: false,
    details: target.details,
  };
  commit({
    ...state,
    items: [
      decision,
      ...state.items.map((item) =>
        item.id === id ? { ...item, status, decidedAt: now, read: true } : item,
      ),
    ],
  });
  send(deciderDemande(id, status));
}

export function markRead(audience, id) {
  const stored = state.items.find((item) => item.id === id);
  if (stored) {
    if (stored.read) return;
    commit({ ...state, items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)) });
    marquerNotificationsLues(audience, [id]).catch(() => {});
    return;
  }
  const key = readKey(audience, id);
  if (state.readIds[audience].includes(key)) return;
  commit({ ...state, readIds: { ...state.readIds, [audience]: [...state.readIds[audience], key] } });
  marquerNotificationsLues(audience, [id]).catch(() => {});
}

// Marque comme lues toutes les notifications données (enregistrées ou
// déduites) d'une audience.
export function markAllRead(audience, ids) {
  const wanted = new Set(ids);
  const items = state.items.map((item) => (wanted.has(item.id) ? { ...item, read: true } : item));
  const storedIds = new Set(state.items.map((item) => item.id));
  const derived = ids
    .filter((id) => !storedIds.has(id))
    .map((id) => readKey(audience, id))
    .filter((key) => !state.readIds[audience].includes(key));
  commit({
    items,
    readIds: { ...state.readIds, [audience]: [...state.readIds[audience], ...derived] },
  });
  if (ids.length > 0) marquerNotificationsLues(audience, ids).catch(() => {});
}

export function isRead(item, notificationState = state) {
  return Boolean(item.read) || notificationState.readIds[item.audience]?.includes(readKey(item.audience, item.id));
}

// Une demande de ce type est-elle en attente ? (ex : "deleteAccount" pour
// savoir si le membre a déjà demandé la suppression de son compte.)
export function hasPendingRequest(type, notificationState = state) {
  return notificationState.items.some(
    (item) => item.kind === "request" && isMine(item) && item.type === type && item.status === "pending",
  );
}
