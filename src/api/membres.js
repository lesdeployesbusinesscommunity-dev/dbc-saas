// Local Imports
import { httpClient } from "./httpClient";
import { adminHeaders } from "./adminHeaders";

// ----------------------------------------------------------------------

// GET /membres (admin) — liste des membres valides (adhesion validee),
// pour Admin/Membres.
export async function listerMembres() {
  const { data } = await httpClient.get("/membres", {
    headers: adminHeaders(),
  });
  return data;
}
