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
