// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /reseau-mlm/reseau-global (admin) — arbre de parrainage complet,
// renvoyé à plat (un noeud par membre, avec son parentMemberId) : c'est au
// frontend de le reconstruire en arbre, voir Admin/Reseau/index.jsx.
export async function reseauGlobal() {
  const { data } = await httpClient.get("/reseau-mlm/reseau-global");
  return data;
}

// GET /reseau-mlm/packs — public, les 6 packs Longrich (prix, PV, niveau DBC
// requis, type de gains).
export async function listerPacks() {
  const { data } = await httpClient.get("/reseau-mlm/packs");
  return data;
}
