// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /adhesion/niveaux — public, catalogue des 8 niveaux DBC.
export async function listerNiveaux() {
  const { data } = await httpClient.get("/adhesion/niveaux");
  return data;
}
