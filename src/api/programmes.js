// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /programmes/piliers — public, les 4 piliers DBC et leurs programmes.
export async function listerPiliers() {
  const { data } = await httpClient.get("/programmes/piliers");
  return data;
}
