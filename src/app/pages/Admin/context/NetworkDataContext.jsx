// Import Dependencies
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

// Local Imports
import { enregistrerReseauTerritorial, listerReseauxTerritoriaux } from "api/gouvernance";
import { loadAdminDirectory, useAdminDirectory } from "../adminDirectory";
import { networkCountries } from "../Reseau/mockData";

// ----------------------------------------------------------------------

// L'organisation territoriale (qui dirige quelle branche, dans quel pays)
// n'appartient pas seulement à "Gestion du réseau" : "Gestion de la
// gouvernance" la lit aussi, pour que "Réseau des Leaders d'Antennes"
// reflète les VRAIES branches et leurs VRAIS responsables. D'où ce contexte
// partagé, monté une fois dans AdminLayout au-dessus de toutes les pages
// admin : les deux pages lisent/écrivent le même état.
//
// L'état vient du serveur (GET /gouvernance/reseau-territorial) et chaque
// changement d'un pays (branche ajoutée, responsable ou coordinateur assigné,
// titre d'échelon renommé) y est enregistré aussitôt (PUT, arbre entier du
// pays). En cas d'échec, l'écran revient à l'état précédent et "saveError"
// l'explique.
const NetworkDataContext = createContext(null);

// Compare deux noms de pays sans se soucier des accents, de la casse, ni
// des espaces/tirets — même technique que normalizeRegionKey dans
// Reseau/countryMaps.js (régions), dupliquée ici en quelques lignes plutôt
// qu'importée : ce fichier gère les PAYS eux-mêmes, un concept distinct des
// régions à l'intérieur d'un pays, pas la peine de coupler les deux.
function normalizeCountryKey(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-_\s]+/g, " ")
    .trim();
}

// Nœud du serveur <-> nœud de la page ({ id, memberId, coordinatorId, label, children }).
const nodeFromApi = (node) => ({
  id: node.id,
  memberId: node.memberId,
  coordinatorId: node.coordinatorId ?? null,
  label: node.label,
  children: node.children.map(nodeFromApi),
});
const nodeToApi = (node) => ({
  id: node.id,
  memberId: node.memberId ?? null,
  coordinatorId: node.coordinatorId ?? null,
  label: node.label ?? null,
  children: node.children.map(nodeToApi),
});

function collectCoordinators(networksByCountry) {
  const result = {};
  const walk = (node) => {
    if (node.coordinatorId) result[node.id] = node.coordinatorId;
    node.children.forEach(walk);
  };
  Object.values(networksByCountry).forEach((root) => root && walk(root));
  return result;
}

function withCoordinators(node, coordinatorsByNodeId) {
  return {
    ...node,
    coordinatorId: coordinatorsByNodeId[node.id] ?? null,
    children: node.children.map((child) => withCoordinators(child, coordinatorsByNodeId)),
  };
}

export function NetworkDataProvider({ children }) {
  useAdminDirectory(); // les noms des responsables s'affichent dès que l'annuaire est chargé
  const [networksByCountry, setNetworks] = useState({});
  const [levelTitlesByCountry, setTitles] = useState({});
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [saveError, setSaveError] = useState("");
  // Dernières valeurs, pour enregistrer l'état à jour sans attendre un rendu.
  const networksRef = useRef(networksByCountry);
  const titlesRef = useRef(levelTitlesByCountry);
  // Pays ajoutés depuis le sélecteur de "Gestion du réseau" (voir
  // CountrySwitcher.jsx) en plus de la liste de base : un admin peut taper le
  // nom d'un pays absent des options. Il n'est enregistré côté serveur
  // qu'une fois qu'il a un réseau.
  const [extraCountries, setExtraCountries] = useState([]);

  useEffect(() => {
    Promise.all([listerReseauxTerritoriaux(), loadAdminDirectory()])
      .then(([networks]) => {
        const trees = {};
        const titles = {};
        networks.forEach((entry) => {
          if (entry.tree) trees[entry.country] = nodeFromApi(entry.tree);
          titles[entry.country] = entry.levelTitles ?? {};
        });
        networksRef.current = trees;
        titlesRef.current = titles;
        setNetworks(trees);
        setTitles(titles);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  // Enregistre un pays ; en cas de refus, rétablit l'état d'avant.
  const persist = (country, previous) => {
    const tree = networksRef.current[country];
    setSaveError("");
    enregistrerReseauTerritorial(country, {
      tree: tree ? nodeToApi(tree) : null,
      levelTitles: titlesRef.current[country] ?? {},
    }).catch((error) => {
      networksRef.current = previous.networks;
      titlesRef.current = previous.titles;
      setNetworks(previous.networks);
      setTitles(previous.titles);
      setSaveError(error.detail ?? "api.errors.server");
    });
  };

  const changedCountries = (before, after) =>
    [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((country) => before[country] !== after[country]);

  // Même usage qu'un setState : valeur ou fonction (état précédent -> nouvel état).
  const setNetworksByCountry = (updater) => {
    const previous = { networks: networksRef.current, titles: titlesRef.current };
    const next = typeof updater === "function" ? updater(networksRef.current) : updater;
    networksRef.current = next;
    setNetworks(next);
    changedCountries(previous.networks, next).forEach((country) => persist(country, previous));
  };

  const setLevelTitlesByCountry = (updater) => {
    const previous = { networks: networksRef.current, titles: titlesRef.current };
    const next = typeof updater === "function" ? updater(titlesRef.current) : updater;
    titlesRef.current = next;
    setTitles(next);
    changedCountries(previous.titles, next).forEach((country) => persist(country, previous));
  };

  // Coordinateurs (binôme du leader de chaque branche, voir Gouvernance) :
  // gardés sur les nœuds de l'arbre, exposés ici comme { idNœud: idMembre }.
  const coordinatorsByNodeId = useMemo(() => collectCoordinators(networksByCountry), [networksByCountry]);
  const setCoordinatorsByNodeId = (updater) => {
    const current = collectCoordinators(networksRef.current);
    const next = typeof updater === "function" ? updater(current) : updater;
    setNetworksByCountry((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([country, root]) => {
          if (!root) return [country, root];
          const updated = withCoordinators(root, next);
          return [country, JSON.stringify(updated) === JSON.stringify(root) ? root : updated];
        }),
      ),
    );
  };

  const allCountries = useMemo(
    () =>
      [...new Set([...networkCountries, ...Object.keys(networksByCountry), ...extraCountries])].sort((a, b) =>
        a.localeCompare(b),
      ),
    [networksByCountry, extraCountries],
  );

  // Ajoute "rawName" à la liste si aucun pays équivalent n'y figure déjà
  // (comparaison tolérante aux accents/casse/tirets, voir
  // normalizeCountryKey) ; renvoie dans tous les cas le nom "canonique" à
  // sélectionner — celui déjà présent dans la liste si ça matchait, sinon
  // le nom tel que tapé. Renvoie null si rawName est vide une fois nettoyé.
  const addCountry = (rawName) => {
    const trimmed = rawName?.trim();
    if (!trimmed) return null;

    const key = normalizeCountryKey(trimmed);
    const existing = allCountries.find((country) => normalizeCountryKey(country) === key);
    if (existing) return { name: existing, isNew: false };

    setExtraCountries((prev) => [...prev, trimmed]);
    return { name: trimmed, isNew: true };
  };

  return (
    <NetworkDataContext.Provider
      value={{
        networksByCountry,
        setNetworksByCountry,
        levelTitlesByCountry,
        setLevelTitlesByCountry,
        coordinatorsByNodeId,
        setCoordinatorsByNodeId,
        allCountries,
        addCountry,
        status,
        saveError,
      }}
    >
      {children}
    </NetworkDataContext.Provider>
  );
}

export function useNetworkData() {
  const context = useContext(NetworkDataContext);
  if (!context) {
    throw new Error("useNetworkData doit être utilisé à l'intérieur de <NetworkDataProvider>.");
  }
  return context;
}
