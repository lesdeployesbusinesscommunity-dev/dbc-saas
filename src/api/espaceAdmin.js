// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /espace-admin/tontine (admin) — bénéficiaires de la tontine ce mois-ci
// (cagnottes remises ou à remettre) et nombre de membres engagés dans une
// vague en cours.
export async function tontineDuMois() {
  const { data } = await httpClient.get("/espace-admin/tontine");
  return data;
}
