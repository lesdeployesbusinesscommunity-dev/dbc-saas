// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /espace-membre — tout ce que l'espace membre affiche sur le membre
// connecté, en un appel : profil, niveaux où il cotise, Coins (historique,
// classement, barème), réseau (parrains, filleuls, retards), MLM, activité.
// Mis en forme pour les pages par Membre/memberStore.js.
export async function getMemberSpace() {
  const { data } = await httpClient.get("/espace-membre");
  return data;
}
