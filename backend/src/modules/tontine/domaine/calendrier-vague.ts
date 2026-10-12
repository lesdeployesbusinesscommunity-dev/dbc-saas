/**
 * Calendrier d'une vague, mois par mois depuis son ouverture : à qui revient
 * la cagnotte chaque mois. Les mois passés montrent les bouffes réelles ; les
 * mois à venir une PROJECTION, en supposant que chacun paie ses cotisations
 * restantes à l'heure (une par mois). Fonction pure, sans effet de bord.
 *
 * Le 1er mois de chaque membre revient à DBC : le premier mois de la vague est
 * marqué "pourDbc".
 */
import { ajouterMois } from './calendrier';
import { COTISATIONS_PAR_MEMBRE } from './participation-tontine';

export type StatutMoisVague = 'closed' | 'current' | 'upcoming';

export interface MoisVague {
  numero: number;
  debut: Date;
  statut: StatutMoisVague;
  pourDbc: boolean;
  /** Membres qui reçoivent la cagnotte ce mois-ci (réel pour le passé, projeté ensuite). */
  beneficiaires: string[];
  projete: boolean;
}

export interface ParticipantCalendrier {
  membreId: string;
  rang: number;
  beneficiaireLe: Date | null;
  /** Cotisations destinées à la caisse (n° 2 à 12) restant à payer. */
  cotisationsCaisseRestantes: number;
}

function debutDuMois(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function memeMois(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

export function calculerCalendrierVague(params: {
  ouverteLe: Date;
  maintenant: Date;
  cagnotte: number;
  cotisationMensuelle: number;
  caisseActuelle: number;
  participants: ParticipantCalendrier[];
}): MoisVague[] {
  const premierMois = debutDuMois(params.ouverteLe);
  const moisCourant = debutDuMois(params.maintenant);
  const mois: MoisVague[] = [];

  // Passé et mois en cours : les bouffes réelles.
  let index = 0;
  for (let debut = premierMois; debut <= moisCourant; debut = ajouterMois(premierMois, ++index)) {
    mois.push({
      numero: index + 1,
      debut,
      statut: memeMois(debut, moisCourant) ? 'current' : 'closed',
      pourDbc: index === 0,
      beneficiaires: params.participants
        .filter((p) => p.beneficiaireLe && memeMois(p.beneficiaireLe, debut))
        .sort((a, b) => a.rang - b.rang)
        .map((p) => p.membreId),
      projete: false,
    });
  }

  // À venir : projection. Chaque participant verse une cotisation par mois
  // tant qu'il lui en reste, et la cagnotte part au plus ancien qui n'a pas
  // encore bouffé dès que la caisse la couvre.
  const enAttente = params.participants.filter((p) => !p.beneficiaireLe).sort((a, b) => a.rang - b.rang);
  const restantes = new Map(params.participants.map((p) => [p.membreId, p.cotisationsCaisseRestantes]));
  let caisse = params.caisseActuelle;
  const limite = COTISATIONS_PAR_MEMBRE * 2; // garde-fou : une vague ne dure jamais plus de 2 ans

  while ((index < COTISATIONS_PAR_MEMBRE || enAttente.length > 0) && index < limite) {
    const debut = ajouterMois(premierMois, index);
    for (const [membreId, reste] of restantes) {
      if (reste > 0) {
        caisse += params.cotisationMensuelle;
        restantes.set(membreId, reste - 1);
      }
    }
    const beneficiaires: string[] = [];
    while (enAttente.length > 0 && caisse >= params.cagnotte) {
      caisse -= params.cagnotte;
      beneficiaires.push(enAttente.shift()!.membreId);
    }
    mois.push({ numero: index + 1, debut, statut: 'upcoming', pourDbc: index === 0, beneficiaires, projete: true });
    index++;
    if (enAttente.length > 0 && [...restantes.values()].every((reste) => reste === 0) && caisse < params.cagnotte) {
      break; // plus aucune cotisation attendue : la projection ne peut plus avancer
    }
  }

  return mois;
}
