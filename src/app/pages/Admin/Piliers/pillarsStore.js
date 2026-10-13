// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { ajouterProgramme, listerPiliers, reglerProgramme, supprimerProgramme } from "api/programmes";
import { pillarGroups, pillars as basePillars } from "./mockData";

// ----------------------------------------------------------------------
// Ce que l'admin change sur les piliers (statut, visibilité pour les
// membres, résumé, explication) — par-dessus les valeurs de départ de
// mockData.js. Enregistré sur le serveur (module Programmes : GET
// /programmes/piliers, PATCH/POST/DELETE /programmes) et partagé entre la
// page admin et la page membre via useSyncExternalStore. Chaque changement
// s'affiche aussitôt puis part au serveur ; s'il est refusé, on recharge
// l'état du serveur.
//
// Forme : { [idPilier]: { status?, visible?, summary?, overview? } }.
// "summary" et "overview", quand ils existent, remplacent le texte
// traduit (FR et EN) du pilier — ils ne sont pas traduits automatiquement.
//
// Programmes AJOUTÉS par l'admin (bouton "Ajouter un programme"), rangés dans
// l'un des 4 piliers. Contrairement aux programmes de départ, leurs textes
// (nom, résumé, explication) ne sont pas dans i18n : ils sont gardés tels
// quels, donc identiques en français et en anglais.
// Forme : [{ id, group, name, summary, overview, status, visible }].

// Réponse du serveur -> réglages des programmes de départ + programmes ajoutés.
function fromServer(groups) {
  const nextOverrides = {};
  const nextCustoms = [];
  groups.forEach((group) =>
    group.programs.forEach((program) => {
      const entry = {
        status: program.status,
        visible: program.visible,
        summary: program.summary ?? "",
        overview: program.overview ?? "",
      };
      if (program.custom) {
        nextCustoms.push({ id: program.code, group: group.code, name: program.name, ...entry });
      } else {
        nextOverrides[program.code] = entry;
      }
    }),
  );
  return { nextOverrides, nextCustoms };
}

let loading = null;

// Charge (ou recharge) les réglages depuis le serveur.
export function loadPillars() {
  loading = listerPiliers()
    .then((groups) => {
      const { nextOverrides, nextCustoms } = fromServer(groups);
      overrides = nextOverrides;
      customs = nextCustoms;
      publish();
    })
    .catch(() => {
      // serveur injoignable : on garde l'affichage actuel
    });
  return loading;
}

// Envoie un changement au serveur ; s'il est refusé, l'écran revient à
// l'état du serveur.
function send(request) {
  request.catch(() => loadPillars());
}

let overrides = {};
let customs = [];
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

function subscribe(listener) {
  if (!loading) loadPillars();
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
  } else {
    overrides = { ...overrides, [id]: { ...(overrides[id] ?? {}), ...patch } };
  }
  publish();
  // "group" ne change qu'à la création ; le serveur ne le reçoit pas ici.
  const reglages = { ...patch };
  delete reglages.group;
  send(reglerProgramme(id, reglages));
}

// Remet un pilier à ses valeurs de départ (textes traduits, statut et
// visibilité d'origine).
export function resetPillar(id) {
  const next = { ...overrides };
  delete next[id];
  overrides = next;
  publish();
  const base = basePillars.find((pillar) => pillar.id === id);
  send(reglerProgramme(id, { status: base?.status ?? "active", visible: true, summary: "", overview: "" }));
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
  publish();
  send(ajouterProgramme({ code: id, group, name, status, visible, summary, overview }));
  return id;
}

// Supprime un programme AJOUTÉ (ceux de départ ne se suppriment pas : on
// les masque avec la visibilité).
export function removePillar(id) {
  customs = customs.filter((entry) => entry.id !== id);
  publish();
  send(supprimerProgramme(id));
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
