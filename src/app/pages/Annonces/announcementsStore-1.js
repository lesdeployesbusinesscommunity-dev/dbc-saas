// Import Dependencies
import { useSyncExternalStore } from "react";
import dayjs from "dayjs";

// Local Imports
import { MAX_IMAGES } from "./imageUtils";

// ----------------------------------------------------------------------
// Les ANNONCES publiées par l'administration ou par un leader d'antenne : un
// message qui s'affiche dans le fil d'actualité des membres concernés (page
// d'accueil) et dans leurs notifications. Gardées dans le navigateur
// (localStorage, protégé par try/catch, mise à jour entre onglets) en
// attendant le backend — même principe que Notifications/notificationsStore.js.
// Une fois le backend branché, une annonce sera une ligne créée par son auteur
// et livrée à ses destinataires, sans changer la forme de ce que ces fonctions
// renvoient.
//
// Une annonce :
//   id, kind ("announcement" | "reminder" : une relance de cotisation envoyée par un
//   leader à un membre, qui n'apparaît pas dans les listes d'annonces), title, body, importance ("normal" | "important"),
//   expiresAt ("AAAA-MM-JJ" ou null : dernier jour d'affichage), createdAt (ms),
//   images     jusqu'à 4 images jointes (data URLs ; absent sur les annonces
//              publiées avant l'ajout des images),
//   author     { role: "admin" | "leader", name, matricule, branchName },
//   audience   ce qu'on AFFICHE de la cible (voir audience.js : "all",
//              "levels", "groups", "antenne", "leaders", "members"),
//   recipients "all" (tous les membres, y compris les futurs) ou la liste des
//              personnes visées au moment de l'envoi (leur matricule, ou leur
//              nom quand elles n'en ont pas encore) — comme une vraie
//              notification, la liste est figée à l'envoi,
//   recipientCount  le nombre de personnes visées.
const STORAGE_KEY = "dbc-announcements-v1";
const MAX_ITEMS = 200;

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.items)) {
      // Écarte les messages enregistrés avec une clé de traduction brute (ex :
      // "admin.tontine.reminders.msg...") à la place du texte : ils ont été
      // créés alors que les traductions n'étaient pas encore chargées.
      const rawKey = /^[a-z][A-Za-z]*(\.[A-Za-z_0-9]+){2,}$/;
      return { items: saved.items.filter((item) => !rawKey.test(String(item.title ?? ""))) };
    }
  } catch {
    // stockage absent ou illisible : on repart d'une liste vide
  }
  return { items: [] };
}

let state = typeof window === "undefined" ? { items: [] } : load();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

// Écrit dans le navigateur ; false si le stockage est indisponible ou plein.
function persist(next) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

function commit(next) {
  state = next;
  // stockage indisponible : les annonces restent valables pour cette session
  persist(next);
  emit();
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

export function getAnnouncements() {
  return state.items;
}

export function useAnnouncements() {
  return useSyncExternalStore(subscribe, getAnnouncements, getAnnouncements);
}

const newId = () => `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Publie une annonce et renvoie son identifiant. "recipients" : "all" ou la
// liste des clés des personnes visées. "images" : des data URLs (voir
// imageUtils.js). Si le navigateur n'a plus la place de garder les images,
// rien n'est publié et la réponse est null : le formulaire le dit à l'auteur.
export function publishAnnouncement({
  kind = "announcement",
  title,
  body,
  importance = "normal",
  expiresAt = null,
  createdAt = Date.now(),
  images = [],
  author,
  audience,
  recipients,
}) {
  const item = {
    id: newId(),
    kind: kind === "reminder" ? "reminder" : "announcement",
    title: String(title).trim(),
    body: String(body).trim(),
    importance: importance === "important" ? "important" : "normal",
    expiresAt: expiresAt || null,
    images: images.slice(0, MAX_IMAGES),
    createdAt,
    author,
    audience,
    recipients,
    recipientCount: recipients === "all" ? null : recipients.length,
  };
  const next = { items: [item, ...state.items].slice(0, MAX_ITEMS) };
  if (item.images.length > 0 && !persist(next)) return null;
  commit(next);
  return item.id;
}

// Retire une annonce : elle disparaît du fil et des notifications de tous ses
// destinataires.
export function removeAnnouncement(id) {
  commit({ items: state.items.filter((item) => item.id !== id) });
}

// Une annonce est affichée jusqu'à la fin de son dernier jour ; sans date, elle
// reste.
export function isActive(announcement, today = dayjs()) {
  return !announcement.expiresAt || !dayjs(announcement.expiresAt).endOf("day").isBefore(today);
}
