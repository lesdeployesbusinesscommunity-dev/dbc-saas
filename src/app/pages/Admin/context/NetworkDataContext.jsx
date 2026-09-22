// Import Dependencies
import { createContext, useContext, useMemo, useState } from "react";

// Local Imports
import { initialNetworksByCountry, networkCountries } from "../Reseau/mockData";

// ----------------------------------------------------------------------

// L'arbre du réseau (qui dirige quelle branche, dans quel pays — voir
// Reseau/mockData.js) n'appartient plus seulement à "Gestion du réseau" :
// "Gestion de la gouvernance" le lit aussi, pour que "Réseau des Leaders
// d'Antennes" reflète les VRAIES branches et leurs VRAIS responsables,
// pas une liste inventée à part (voir Gouvernance/mockData.js). D'où ce
// contexte partagé, monté une fois dans AdminLayout au-dessus de toutes
// les pages admin : les deux pages lisent/écrivent le même état, donc un
// changement fait dans Gestion du réseau (assigner, ajouter une branche…)
// est immédiatement visible dans Gouvernance, tant qu'on reste dans la
// session (toujours pas de backend — rien ne survit à un rechargement de
// page, comme le reste de l'admin).
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

export function NetworkDataProvider({ children }) {
  const [networksByCountry, setNetworksByCountry] = useState(initialNetworksByCountry);
  // Pays ajoutés depuis le sélecteur de "Gestion du réseau" (voir
  // CountrySwitcher.jsx) en plus de la liste figée networkCountries — un
  // admin peut taper le nom d'un pays absent des options et l'ajouter tout
  // de suite, sans attendre une mise à jour du code. Comme le reste de cet
  // état, ça ne survit pas à un rechargement de page tant qu'il n'y a pas
  // de vrai backend pour stocker la liste des pays actifs de la DBC.
  const [extraCountries, setExtraCountries] = useState([]);

  const allCountries = useMemo(
    () => [...networkCountries, ...extraCountries].sort((a, b) => a.localeCompare(b)),
    [extraCountries],
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
      value={{ networksByCountry, setNetworksByCountry, allCountries, addCountry }}
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
