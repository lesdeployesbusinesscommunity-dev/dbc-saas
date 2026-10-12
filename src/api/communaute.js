// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// GET /communaute/antennes — public, liste des antennes (leader/coordinateur
// peuvent être vacants).
export async function listerAntennes() {
  const { data } = await httpClient.get("/communaute/antennes");
  return data;
}

// GET /communaute/zones — public. Une antenne référence une zone (zoneId) ;
// utile pour retrouver le pays d'une antenne (voir Admin/Gouvernance).
export async function listerZones() {
  const { data } = await httpClient.get("/communaute/zones");
  return data;
}

// POST /communaute/antennes/:id/coordinateur (admin) — memberId absent/vide
// pour libérer le poste. Le "leader" d'une antenne (leaderMembreId) ne se
// gère pas ici : c'est le membre qui a créé/rejoint l'antenne en premier
// (voir POST /communaute/antennes/:id/rejoindre), pas une nomination admin.
export async function assignerCoordinateurAntenne(antenneId, memberId) {
  const { data } = await httpClient.post(
    `/communaute/antennes/${antenneId}/coordinateur`,
    { memberId: memberId || undefined },
  );
  return data;
}
