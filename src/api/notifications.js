// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /notifications — demandes (toutes pour un administrateur, les siennes
// pour un membre) et identifiants des notifications déduites déjà lues.
export async function listerNotifications() {
  const { data } = await httpClient.get("/notifications");
  return data;
}

// POST /notifications/demandes — le membre envoie une demande à l'admin.
export async function deposerDemande(type, details) {
  const { data } = await httpClient.post("/notifications/demandes", { type, details });
  return data;
}

// POST /notifications/demandes/retirer — le membre retire sa demande en attente de ce type.
export async function retirerDemande(type) {
  const { data } = await httpClient.post("/notifications/demandes/retirer", { type });
  return data;
}

// POST /notifications/demandes/:id/decision (admin) — "validated" | "refused".
export async function deciderDemande(id, status) {
  const { data } = await httpClient.post(`/notifications/demandes/${id}/decision`, { status });
  return data;
}

// POST /notifications/lues — audience "membre" | "admin".
export async function marquerNotificationsLues(audience, ids) {
  const { data } = await httpClient.post("/notifications/lues", { audience, ids });
  return data;
}
