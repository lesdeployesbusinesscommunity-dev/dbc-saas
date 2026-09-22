// Local Imports
import { httpClient } from "./httpClient";
import { adminHeaders } from "./adminHeaders";

// ----------------------------------------------------------------------

// GET /reseau-mlm/reseau-global (admin) — arbre de parrainage complet,
// renvoyé à plat (un noeud par membre, avec son parentMemberId) : c'est au
// frontend de le reconstruire en arbre, voir Admin/Reseau/index.jsx.
export async function reseauGlobal() {
  const { data } = await httpClient.get("/reseau-mlm/reseau-global", {
    headers: adminHeaders(),
  });
  return data;
}
