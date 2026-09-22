// Import Dependencies
import { createElement } from "react";

// Local Imports
import { RegionMap } from "./CameroonMap";
import { CAMEROON_REGIONS, CAMEROON_VIEWBOX } from "./cameroonRegions";
import { GHANA_REGIONS, GHANA_VIEWBOX } from "./ghanaRegions";
import { MALI_REGIONS, MALI_VIEWBOX } from "./maliRegions";
import { NIGERIA_REGIONS, NIGERIA_VIEWBOX } from "./nigeriaRegions";
import { SENEGAL_REGIONS, SENEGAL_VIEWBOX } from "./senegalRegions";

// ----------------------------------------------------------------------

// Construit une entrée de COUNTRY_MAPS à partir d'un fichier de régions
// (regions/viewBox, voir cameroonRegions.js et les fichiers similaires) —
// ajouter un pays ne demande plus qu'un fichier de régions + un appel ici,
// sans toucher à Reseau/index.jsx ni à RegionMap.jsx. Écrit avec
// createElement plutôt qu'en JSX : ce fichier garde l'extension ".js"
// (un pur registre de données jusqu'ici), et certains outils de build ne
// parsent le JSX que dans les fichiers ".jsx".
function makeCountryMap({ regions, viewBox, ariaLabel }) {
  return {
    Component: (props) =>
      createElement(RegionMap, { ...props, regions, viewBox, ariaLabel }),
    // Noms de région tels qu'utilisés dans les chemins SVG — sert à repérer,
    // parmi les libellés de branche de l'arbre (ex: "Centre", "Littoral"),
    // lesquels correspondent à une vraie région du pays (une branche plus
    // profonde comme "Yaoundé" ne matche rien ici, et c'est voulu : le pin
    // se pose sur la région, pas sur chaque ville).
    regionNames: regions.map((region) => region.name),
  };
}

// Registre "pays -> carte régionale disponible", pour la carte de présence
// affichée à gauche de l'arbre (voir Reseau/index.jsx). Le composant à
// gauche de l'arbre n'est affiché que pour les pays présents ici ; tous les
// autres pays de networkCountries gardent l'arbre en pleine largeur, comme
// avant.
export const COUNTRY_MAPS = {
  Cameroun: makeCountryMap({
    regions: CAMEROON_REGIONS,
    viewBox: CAMEROON_VIEWBOX,
    ariaLabel: "Carte du Cameroun",
  }),
  Nigéria: makeCountryMap({
    regions: NIGERIA_REGIONS,
    viewBox: NIGERIA_VIEWBOX,
    ariaLabel: "Carte du Nigéria",
  }),
  Ghana: makeCountryMap({
    regions: GHANA_REGIONS,
    viewBox: GHANA_VIEWBOX,
    ariaLabel: "Carte du Ghana",
  }),
  Sénégal: makeCountryMap({
    regions: SENEGAL_REGIONS,
    viewBox: SENEGAL_VIEWBOX,
    ariaLabel: "Carte du Sénégal",
  }),
  Mali: makeCountryMap({
    regions: MALI_REGIONS,
    viewBox: MALI_VIEWBOX,
    ariaLabel: "Carte du Mali",
  }),
};

// Compare deux libellés sans se soucier des accents, de la casse, ni de
// "-" vs espace — un admin qui crée une branche "extreme nord", "Extreme
// Nord" ou "EXTRÊME NORD" doit voir le pin apparaître sur la carte dans
// tous les cas, sans avoir à deviner l'orthographe exacte du nom de
// région ("Extrême-Nord").
export function normalizeRegionKey(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-_\s]+/g, " ")
    .trim();
}

// Vrai si "node" ou n'importe lequel de ses descendants a un responsable en
// poste (memberId non nul) — sert à distinguer une région où la DBC est
// vraiment active d'une branche créée mais encore vacante (voir
// getPresenceRegions ci-dessous : une branche "Littoral" sans personne
// assignée, et sans sous-branche pourvue, ne doit PAS afficher de pin sur
// la carte — sinon la carte prétend une présence qui n'existe pas encore).
function subtreeHasStaffedMember(node) {
  if (node.memberId) return true;
  return node.children.some(subtreeHasStaffedMember);
}

// Étant donné la racine de l'arbre du réseau du pays actif (voir "root"
// dans Reseau/index.jsx) et sa carte, renvoie les VRAIS noms de région
// (ceux utilisés par les chemins SVG, donc directement exploitables par
// <countryMap.Component presenceRegions={...} />) où la DBC a RÉELLEMENT
// quelqu'un en poste — pas seulement une branche réservée mais vide.
// Entièrement recalculé à partir de l'arbre à chaque appel — jamais une
// liste figée : assigner un responsable, ajouter/renommer/supprimer une
// branche change ce que cette fonction renvoie au prochain rendu (voir
// Reseau/index.jsx, qui la rappelle dans un useMemo à chaque changement de
// l'arbre).
export function getPresenceRegions(countryMap, root) {
  if (!countryMap || !root) return [];

  const byNormalizedName = new Map(
    countryMap.regionNames.map((name) => [normalizeRegionKey(name), name]),
  );

  const present = new Set();

  const walk = (node) => {
    if (node.label) {
      const match = byNormalizedName.get(normalizeRegionKey(node.label));
      if (match && subtreeHasStaffedMember(node)) {
        present.add(match);
      }
    }
    node.children.forEach(walk);
  };
  walk(root);

  return [...present];
}
