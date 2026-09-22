// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /communaute/antennes — public, liste des antennes (leader/coordinateur
// peuvent être vacants).
export async function listerAntennes() {
  const { data } = await httpClient.get("/communaute/antennes");
  return data;
}
