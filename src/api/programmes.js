// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /programmes/piliers — public, les 4 piliers DBC et leurs programmes,
// avec les réglages de l'admin (statut, visibilité, résumé, explication).
export async function listerPiliers() {
  const { data } = await httpClient.get("/programmes/piliers");
  return data;
}

// POST /programmes (admin) — ajoute un programme dans un pilier. "code"
// est choisi par l'interface et commence par "custom-".
export async function ajouterProgramme({ code, group, name, status, visible, summary, overview }) {
  const { data } = await httpClient.post("/programmes", { code, group, name, status, visible, summary, overview });
  return data;
}

// PATCH /programmes/:code (admin) — règle un programme ; un texte vide
// rétablit le texte d'origine. "name" : programmes ajoutés seulement.
export async function reglerProgramme(code, reglages) {
  const { data } = await httpClient.patch(`/programmes/${encodeURIComponent(code)}`, reglages);
  return data;
}

// DELETE /programmes/:code (admin) — supprime un programme ajouté.
export async function supprimerProgramme(code) {
  const { data } = await httpClient.delete(`/programmes/${encodeURIComponent(code)}`);
  return data;
}
