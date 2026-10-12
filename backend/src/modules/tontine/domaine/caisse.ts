/**
 * Caisse d'une vague = cotisations payées destinées à la caisse (hors frais de
 * retrait, hors 1re cotisation qui revient à DBC) − cagnottes déjà attribuées.
 */
import { CotisationTontine } from './cotisation-tontine';
import { TourTontine } from './tour-tontine';

export function calculerCaisse(cotisations: CotisationTontine[], tours: TourTontine[]): number {
  const encaisse = cotisations
    .filter((c) => c.statut === 'payee' && c.destination === 'caisse')
    .reduce((total, c) => total + c.montant, 0);
  const attribue = tours.filter((t) => t.statut !== 'en_cours').reduce((total, t) => total + t.montant, 0);
  return encaisse - attribue;
}
