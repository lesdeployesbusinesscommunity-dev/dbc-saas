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

// GET /espace-membre/preferences — notifications et confidentialité du membre.
export async function lirePreferences() {
  const { data } = await httpClient.get("/espace-membre/preferences");
  return data;
}

// PUT /espace-membre/preferences — le serveur applique la confidentialité :
// ce que le membre cache n'est plus envoyé aux autres membres.
export async function enregistrerPreferences({ notificationsEnabled, notifications, privacy }) {
  const { data } = await httpClient.put("/espace-membre/preferences", { notificationsEnabled, notifications, privacy });
  return data;
}
