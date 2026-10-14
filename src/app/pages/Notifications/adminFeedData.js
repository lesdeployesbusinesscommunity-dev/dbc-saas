// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { listerEnAttente } from "api/demandesInscription";
import { financesParNiveau, tontineDuMois } from "api/espaceAdmin";
import { levelKeyFromCode } from "utils/levelCodes";

// ----------------------------------------------------------------------
// Ce dont le fil de notifications ADMIN a besoin pour ses alertes (voir
// feeds.js, "adminDerived") : les demandes d'adhésion à valider, les
// cotisations du mois par niveau (et qui est en retard), et les cagnottes du
// mois. Chargé depuis le serveur la première fois que le fil admin est
// affiché, puis rechargé régulièrement tant qu'il l'est.
const REFRESH_MS = 60 * 1000;

let data = { pendingJoins: [], financeByLevel: {}, beneficiaries: [] };
let version = 0;
let loading = false;
let loadedOnce = false;
let timer = null;
const listeners = new Set();

function load() {
  if (loading) return;
  loading = true;
  Promise.all([listerEnAttente(), financesParNiveau(), tontineDuMois()])
    .then(([joins, finances, tontine]) => {
      data = {
        pendingJoins: joins.filter((join) => join.status === "en_attente"),
        financeByLevel: Object.fromEntries(finances.map((entry) => [levelKeyFromCode(entry.levelCode), entry])),
        beneficiaries: tontine.beneficiaries.map((entry) => ({ ...entry, levelKey: levelKeyFromCode(entry.levelCode) })),
      };
      version += 1;
      listeners.forEach((listener) => listener());
    })
    .catch(() => {
      // serveur injoignable ou compte non admin : pas d'alertes
    })
    .finally(() => {
      loading = false;
    });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getVersion = () => version;

// Se redessiner quand les données sont (re)chargées.
export function useAdminFeedVersion() {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

// Les données du fil admin ; lance le chargement (et son rafraîchissement)
// la première fois.
export function getAdminFeedData() {
  if (!loadedOnce) {
    loadedOnce = true;
    load();
  }
  if (!timer && listeners.size > 0) timer = setInterval(load, REFRESH_MS);
  return data;
}
