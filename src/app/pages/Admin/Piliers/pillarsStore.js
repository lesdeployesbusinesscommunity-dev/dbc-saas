// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { pillarGroups, pillars as basePillars } from "./mockData";

// ----------------------------------------------------------------------
// Ce que l'admin change sur les piliers (statut, visibilité pour les
// membres, résumé, explication) — par-dessus les valeurs de départ de
// mockData.js. Pas de backend pour l'instant : gardé dans le navigateur
// (localStorage, protégé par try/catch — il peut être absent ou bloqué)
// et partagé entre la page admin et la page membre via
// useSyncExternalStore, donc une modification faite côté admin se voit
// tout de suite côté membre dans ce navigateur. À remplacer par de vrais
// appels API sans changer ce que "getPillars" renvoie.
//
// Forme : { [idPilier]: { status?, visible?, summary?, overview? } }.
// "summary" et "overview", quand ils existent, remplacent le texte
// traduit (FR et EN) du pilier — ils ne sont pas traduits automatiquement.
const STORAGE_KEY = "dbc-piliers-overrides-v1";

// Programmes AJOUTÉS par l'admin (bouton "Ajouter un programme"), rangés dans
// l'un des 4 piliers. Contrairement aux programmes de départ, leurs textes
// (nom, résumé, explication) ne sont pas dans i18n : ils sont gardés tels
// quels ici, donc identiques en français et en anglais.
// Forme : [{ id, group, name, summary, overview, status, visible }].
const CUSTOM_KEY = "dbc-piliers-custom-v1";

function loadCustom() {
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

let overrides = load();
let customs = loadCustom();
let snapshot = merge(overrides);
const listeners = new Set();

function merge(current) {
  const base = basePillars.map((pillar) => ({
    ...pillar,
    visible: true,
    ...(current[pillar.id] ?? {}),
  }));
  // Un programme ajouté a l'icône de son pilier ; il n'ouvre sa propre page
  // d'explication que s'il a une explication.
  const added = customs
    .filter((entry) => pillarGroups.some((group) => group.key === entry.group))
    .map((entry) => ({
      ...entry,
      custom: true,
      Icon: pillarGroups.find((group) => group.key === entry.group).Icon,
      page: Boolean(entry.overview),
    }));
  return [...base, ...added];
}

function publish() {
  snapshot = merge(overrides);
  listeners.forEach((listener) => listener());
}

function persist(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible : la modification reste valable pour cette session
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Le tableau n'est reconstruit que quand quelque chose change : même
// référence entre deux rendus, comme l'exige useSyncExternalStore.
export function getPillars() {
  return snapshot;
}

export function usePillars() {
  return useSyncExternalStore(subscribe, getPillars, getPillars);
}

export function updatePillar(id, patch) {
  if (customs.some((entry) => entry.id === id)) {
    // Programme ajouté : on modifie directement son enregistrement.
    customs = customs.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
    persist(CUSTOM_KEY, customs);
  } else {
    overrides = { ...overrides, [id]: { ...(overrides[id] ?? {}), ...patch } };
    persist(STORAGE_KEY, overrides);
  }
  publish();
}

// Remet un pilier à ses valeurs de départ (textes traduits, statut et
// visibilité d'origine).
export function resetPillar(id) {
  const next = { ...overrides };
  delete next[id];
  overrides = next;
  persist(STORAGE_KEY, overrides);
  publish();
}

// Brouillon vide d'un programme à ajouter (id null = pas encore créé),
// pour la fenêtre "Ajouter un programme".
export function newPillarDraft(group) {
  return { id: null, custom: true, group, name: "", summary: "", overview: "", status: "active", visible: true };
}

// Ajoute un programme dans un pilier ; renvoie son identifiant.
export function addPillar({ group, name, summary = "", overview = "", status = "active", visible = true }) {
  const id = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  customs = [...customs, { id, group, name, summary, overview, status, visible }];
  persist(CUSTOM_KEY, customs);
  publish();
  return id;
}

// Supprime un programme AJOUTÉ (ceux de départ ne se suppriment pas : on
// les masque avec la visibilité).
export function removePillar(id) {
  customs = customs.filter((entry) => entry.id !== id);
  persist(CUSTOM_KEY, customs);
  publish();
}

// Texte affiché d'un pilier : la version modifiée par l'admin si elle
// existe, sinon la version traduite. "t" vient de useTranslation().
export function getPillarText(pillar, t) {
  if (pillar.custom) {
    return {
      name: pillar.name,
      summary: pillar.summary,
      overview: pillar.overview,
      points: [],
      audience: "",
      tag: "",
      facts: [],
    };
  }
  const key = `piliers.items.${pillar.id}`;
  const points = t(`${key}.points`, { returnObjects: true, defaultValue: {} });
  // "facts" : chiffres clés de certains piliers (ex : 12 mois, 36 membres
  // minimum pour la Tontine Royale) — absents des autres.
  const facts = t(`${key}.facts`, { returnObjects: true, defaultValue: {} });
  return {
    name: t(`${key}.name`),
    summary: pillar.summary || t(`${key}.summary`),
    overview: pillar.overview || t(`${key}.overview`, { defaultValue: "" }),
    points: points && typeof points === "object" ? Object.values(points) : [],
    audience: t(`${key}.audience`, { defaultValue: "" }),
    // Repère de niveau d'un programme FORMER (Niv.1→4, Niv.3+...), absent des autres.
    tag: t(`${key}.tag`, { defaultValue: "" }),
    facts: facts && typeof facts === "object" ? Object.values(facts) : [],
  };
}
