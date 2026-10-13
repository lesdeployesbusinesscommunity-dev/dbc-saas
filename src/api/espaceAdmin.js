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

// GET /espace-admin/finances (admin) — chiffres de la tontine niveau par
// niveau (caisse, total collecté, cotisations du mois, avancement du cycle,
// nombre de membres).
export async function financesParNiveau() {
  const { data } = await httpClient.get("/espace-admin/finances");
  return data;
}
