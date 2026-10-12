// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------
// Formations (module 7, LMS). Une formation = sa fiche (formateur, affiche,
// date, durée, objectifs, acquis, support PDF, quiz de pré-requis) et son
// programme : des chapitres avec leurs vidéos, supports PDF et quiz de
// validation — la forme qu'édite "Gestion des formations".

// GET /formations — public : catalogue complet, quiz SANS les bonnes réponses.
export async function listerFormations() {
  const { data } = await httpClient.get("/formations");
  return data;
}

// GET /formations/admin/catalogue (admin) — catalogue avec les bonnes réponses.
export async function listerFormationsAdmin() {
  const { data } = await httpClient.get("/formations/admin/catalogue");
  return data;
}

// POST /formations (admin) — crée une formation entière ; renvoie la formation
// enregistrée (avec les identifiants donnés par le serveur).
export async function creerFormation(training) {
  const { data } = await httpClient.post("/formations", training);
  return data;
}

// PUT /formations/:id (admin) — remplace la fiche et le programme.
export async function modifierFormation(id, training) {
  const { data } = await httpClient.put(`/formations/${id}`, training);
  return data;
}

// DELETE /formations/:id (admin).
export async function supprimerFormation(id) {
  const { data } = await httpClient.delete(`/formations/${id}`);
  return data;
}

// GET /formations/ma-progression — mon avancement dans chaque formation commencée.
export async function maProgression() {
  const { data } = await httpClient.get("/formations/ma-progression");
  return data;
}

// POST /formations/lecons/:id/suivre — vidéo regardée / PDF ouvert.
export async function terminerLecon(lessonId) {
  const { data } = await httpClient.post(`/formations/lecons/${lessonId}/suivre`);
  return data;
}

// POST /formations/lecons/:id/quiz — réponses à un quiz de chapitre, corrigées
// par le serveur ; renvoie score et correction.
export async function repondreQuizLecon(lessonId, answers) {
  const { data } = await httpClient.post(`/formations/lecons/${lessonId}/quiz`, { answers });
  return data;
}

// POST /formations/:id/prerequis — réponses au quiz de pré-requis.
export async function repondrePrerequis(trainingId, answers) {
  const { data } = await httpClient.post(`/formations/${trainingId}/prerequis`, { answers });
  return data;
}

// POST /formations/:id/recommencer — l'avancement repart de zéro (les acquis restent).
export async function recommencerFormation(trainingId) {
  const { data } = await httpClient.post(`/formations/${trainingId}/recommencer`);
  return data;
}
