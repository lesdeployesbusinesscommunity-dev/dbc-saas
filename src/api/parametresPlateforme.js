// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /parametres-plateforme — public, les réglages de la plateforme
// (lus par l'espace membre comme par l'admin).
export async function lireParametresPlateforme() {
  const { data } = await httpClient.get("/parametres-plateforme");
  return data;
}

// PUT /parametres-plateforme (admin) — enregistre tous les réglages ; le
// serveur renvoie les valeurs retenues (ramenées dans leurs bornes).
export async function enregistrerParametresPlateforme(settings) {
  const { data } = await httpClient.put("/parametres-plateforme", settings);
  return data;
}
