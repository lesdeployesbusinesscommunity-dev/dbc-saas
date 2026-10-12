/**
 * Calcul d'échéances mensuelles. Un membre entré le 31 janvier doit sa 2e
 * cotisation le 28 (ou 29) février, pas le 3 mars : on borne le jour au
 * dernier jour du mois cible.
 */
export function ajouterMois(date: Date, mois: number): Date {
  const resultat = new Date(date.getTime());
  const jour = resultat.getUTCDate();
  resultat.setUTCDate(1);
  resultat.setUTCMonth(resultat.getUTCMonth() + mois);
  const dernierJourDuMois = new Date(Date.UTC(resultat.getUTCFullYear(), resultat.getUTCMonth() + 1, 0)).getUTCDate();
  resultat.setUTCDate(Math.min(jour, dernierJourDuMois));
  return resultat;
}
