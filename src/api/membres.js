// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------
// "Gestion des membres" (admin).

// GET /membres — les membres avec leur fiche complète (parrain, filleuls,
// versements, formations, prochaine échéance de tontine, distinctions).
export async function listerMembres() {
  const { data } = await httpClient.get("/membres");
  return data;
}

// POST /membres — inscrit directement un membre (matricule attribué par le
// serveur) ; il se connecte ensuite avec le mot de passe temporaire.
export async function creerMembre(payload) {
  const { data } = await httpClient.post("/membres", payload);
  return data;
}

// PATCH /membres/:id — profil, niveau, statut (actif / desactive), Coins.
export async function modifierMembre(id, payload) {
  const { data } = await httpClient.patch(`/membres/${id}`, payload);
  return data;
}

// DELETE /membres/:id — compte fermé, historique conservé.
export async function supprimerMembre(id) {
  const { data } = await httpClient.delete(`/membres/${id}`);
  return data;
}
