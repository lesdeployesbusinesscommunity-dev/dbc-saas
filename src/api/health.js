// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /health — endpoint de verification de vie, ne depend d'aucune
// ressource externe (ni base de donnees, ni cache) cote backend. Reponse
// attendue : { statut: "ok", horodatage: "<ISO 8601>" }.
//
// Les cles francaises ("statut", "horodatage") viennent telles quelles du
// backend et sont conservees sans renommage ici.
export async function checkHealth() {
  const { data } = await httpClient.get("/health");
  return data;
}
