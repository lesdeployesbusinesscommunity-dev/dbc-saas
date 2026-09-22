// Local Imports
import { httpClient } from "./httpClient";
import { adminHeaders } from "./adminHeaders";

// ----------------------------------------------------------------------

// POST /demandes-inscription — public, soumis par un visiteur (formulaire
// Inscription). Le backend cree une demande "en_attente" ; un admin la
// valide ensuite (voir valider ci-dessous), il n'y a pas d'auto-inscription
// en libre-service.
export async function creerDemande(payload) {
  const { data } = await httpClient.post("/demandes-inscription", payload);
  return data;
}

// GET /demandes-inscription (admin) — demandes en attente de validation.
export async function listerEnAttente() {
  const { data } = await httpClient.get("/demandes-inscription", {
    headers: adminHeaders(),
  });
  return data;
}

// POST /demandes-inscription/:id/valider (admin) — cree le compte + le
// membre avec le mot de passe temporaire fourni par l'admin.
export async function valider(id, { temporaryPassword }) {
  const { data } = await httpClient.post(
    `/demandes-inscription/${id}/valider`,
    { temporaryPassword },
    { headers: adminHeaders() },
  );
  return data;
}
