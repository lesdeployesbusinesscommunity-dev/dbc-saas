// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------
// Tontine par vagues (module 4) : une vague = 11 membres max d'un même
// niveau ; le 1er mois de chaque membre va à DBC, puis la cagnotte part au
// plus ancien de la vague dès que la caisse la couvre. Un membre peut cotiser
// à plusieurs niveaux (jamais au-dessus de son niveau d'adhésion), avec une
// vague active par niveau.

// GET /tontine/ma-tontine?levelCode= — ma vague à ce niveau : membres et
// leur suivi, calendrier des bouffes (réel puis projeté), mon prochain
// paiement, mes vagues terminées.
export async function getMyTontine(levelCode) {
  const { data } = await httpClient.get("/tontine/ma-tontine", { params: { levelCode } });
  return data;
}

// POST /tontine/rejoindre — entre dans la vague la plus récente du niveau (et
// initie la 1re cotisation, pour DBC), ou s'inscrit sur la liste d'attente.
export async function joinWave({ levelCode, waitForNextWave = false }) {
  const { data } = await httpClient.post("/tontine/rejoindre", { levelCode, waitForNextWave });
  return data;
}

// POST /tontine/cotisations?levelCode= — initie le paiement Mobile Money de ma
// prochaine cotisation à ce niveau (cotisation + frais de retrait). La
// confirmation arrive par le fournisseur de paiement.
export async function payContribution(levelCode) {
  const { data } = await httpClient.post("/tontine/cotisations", null, { params: { levelCode } });
  return data;
}

// GET /tontine/frais-retrait — public : cotisation et frais par niveau.
export async function getWithdrawalFees() {
  const { data } = await httpClient.get("/tontine/frais-retrait");
  return data;
}
