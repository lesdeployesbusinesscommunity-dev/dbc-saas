// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /formations — public, catalogue des formations.
export async function listerFormations() {
  const { data } = await httpClient.get("/formations");
  return data;
}

// GET /formations/:id — public, detail d'une formation : modules et leurs
// leçons (module 7, LMS).
export async function obtenirFormation(id) {
  const { data } = await httpClient.get(`/formations/${id}`);
  return data;
}

// POST /formations (admin). Les noms de champs attendus par le backend
// (titre, niveauRequisId, pilierCode) sont en français ici, contrairement
// au reste de la surface d'API — incohérence existante côté backend, pas
// introduite ici.
export async function creerFormation({ code, title, requiredLevelId, pillarCode }) {
  const { data } = await httpClient.post(
    "/formations",
    { code, titre: title, niveauRequisId: requiredLevelId, pilierCode: pillarCode },
  );
  return data;
}
