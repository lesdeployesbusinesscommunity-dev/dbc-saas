// Import Dependencies
import axios from "axios";

// ----------------------------------------------------------------------

// Client HTTP centralise pour tous les appels vers l'API backend (NestJS).
//
// Regles de securite appliquees ici (voir le brief envoye avant l'integration) :
// - L'URL de base vient d'une variable d'environnement (VITE_API_BASE_URL),
//   jamais codee en dur dans le code : ca permet de changer d'environnement
//   (dev / staging / prod) sans toucher au code, et evite de "figer" une URL
//   interne dans le bundle livre au navigateur.
// - Aucun secret (cle API, token statique, etc.) n'est stocke ici : Vite
//   expose TOUTES les variables prefixees VITE_ dans le bundle cote client,
//   donc ce prefixe ne doit jamais porter une vraie information sensible.
// - Un timeout est defini pour eviter qu'une requete bloque indefiniment
//   l'interface si le backend ne repond pas.
// - Les erreurs sont normalisees (voir normalizeError) : le detail brut
//   renvoye par le backend (stack trace, message technique, etc.) n'est
//   jamais affiche tel quel a l'utilisateur final.
// - Aucun log de donnees sensibles (email, CNI, futur mot de passe, token)
//   n'est fait ici, meme en cas d'erreur.
//
// Aucun composant ne doit appeler axios/fetch directement : tout passe par
// ce fichier (ou par les modules de src/api/*.js qui l'utilisent), afin de
// garder un seul endroit ou la configuration reseau et la gestion d'erreurs
// sont definies.

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL && import.meta.env.DEV) {
  // Avertissement developpeur uniquement (jamais en production) : aide a
  // detecter rapidement un ".env" manquant plutot que de laisser echouer
  // silencieusement chaque appel avec une URL "undefined".
  // eslint-disable-next-line no-console
  console.warn(
    "[api] VITE_API_BASE_URL est manquant : voir .env.example a la racine du projet.",
  );
}

export const httpClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Transforme une erreur axios en une erreur "propre" et sure a afficher :
// - status : code HTTP si disponible (ou null si la requete n'a pas abouti,
//   ex. backend indisponible / coupure reseau)
// - message : message generique, jamais le detail technique brut du backend
//   (pas de stack trace, pas de nom de colonne SQL, etc.)
function normalizeError(error) {
  const status = error.response?.status ?? null;

  if (!error.response) {
    // Pas de reponse du serveur (backend down, CORS mal configure cote
    // backend, coupure reseau...) : message generique, pas de detail
    // technique expose a l'utilisateur.
    return { status, message: "api.errors.network" };
  }

  if (status >= 500) {
    return { status, message: "api.errors.server" };
  }

  if (status === 401 || status === 403) {
    return { status, message: "api.errors.unauthorized" };
  }

  if (status === 404) {
    return { status, message: "api.errors.notFound" };
  }

  // 400 / 422 etc. : erreurs de validation. On ne remonte pas le corps brut
  // renvoye par le backend, seulement une cle de traduction generique ; un
  // futur besoin d'afficher un message de validation precis devra passer
  // par une whitelist explicite de champs, jamais par un affichage direct
  // de error.response.data.
  return { status, message: "api.errors.validation" };
}

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error)),
);
