// Local Imports
import { httpClient } from "./httpClient";
import { adminHeaders } from "./adminHeaders";

// ----------------------------------------------------------------------

// GET /gouvernance/tableau-de-bord (admin) — vue globale agregee pour
// Admin/Dashboard : membres, niveaux, paiements, piliers, programmes,
// antennes. ongoingTontinePots/totalTontineMembers restent null tant que
// le module Tontine n'est pas implemente cote backend.
export async function tableauDeBord() {
  const { data } = await httpClient.get("/gouvernance/tableau-de-bord", {
    headers: adminHeaders(),
  });
  return data;
}

// GET /gouvernance/poles (admin) — pôles de gouvernance et leurs sièges.
export async function listerPoles() {
  const { data } = await httpClient.get("/gouvernance/poles", {
    headers: adminHeaders(),
  });
  return data;
}

// POST /gouvernance/sieges/:id/assigner (admin) — memberId absent/vide pour
// libérer le siège.
export async function assignerSiege(siegeId, memberId) {
  const { data } = await httpClient.post(
    `/gouvernance/sieges/${siegeId}/assigner`,
    { memberId: memberId || undefined },
    { headers: adminHeaders() },
  );
  return data;
}

// POST /gouvernance/poles (admin) — cree un pole "a postes nommes" ; renvoie
// la liste a jour de tous les poles (meme forme que listerPoles).
export async function creerPole({ name, description, icon, seats }) {
  const { data } = await httpClient.post(
    "/gouvernance/poles",
    { name, description, icon, seats },
    { headers: adminHeaders() },
  );
  return data;
}

// PATCH /gouvernance/poles/:id (admin) — renomme le pole et remplace sa
// liste de sieges (voir PoleFormModal : un siege sans "id" est cree, un
// siege existant absent de la liste est supprime).
export async function modifierPole(poleId, { name, description, icon, seats }) {
  const { data } = await httpClient.patch(
    `/gouvernance/poles/${poleId}`,
    { name, description, icon, seats },
    { headers: adminHeaders() },
  );
  return data;
}

// DELETE /gouvernance/poles/:id (admin).
export async function supprimerPole(poleId) {
  const { data } = await httpClient.delete(`/gouvernance/poles/${poleId}`, {
    headers: adminHeaders(),
  });
  return data;
}

// PATCH /gouvernance/poles/reordonner (admin) — poleIds = tous les ids,
// dans le nouvel ordre voulu.
export async function reordonnerPoles(poleIds) {
  const { data } = await httpClient.patch(
    "/gouvernance/poles/reordonner",
    { poleIds },
    { headers: adminHeaders() },
  );
  return data;
}
