/**
 * Simulation d'une vague complète avec les seules règles du domaine — c'est
 * l'exemple validé avec l'équipe DBC : niveau Starter (5 000 FCFA/mois,
 * cagnotte 55 000 FCFA), 5 membres au lieu de 11. Le 1er mois va à DBC, puis
 * les membres cotisent jusqu'à ce que la caisse couvre chaque cagnotte.
 */
import { calculerCaisse } from './caisse';
import { CotisationTontine } from './cotisation-tontine';
import { COTISATIONS_PAR_MEMBRE, ParticipationTontine, prochainBeneficiaire } from './participation-tontine';
import { TourTontine } from './tour-tontine';

const COTISATION = 5_000;
const CAGNOTTE = 55_000;

function simulerVague(nombreDeMembres: number) {
  const participations = Array.from({ length: nombreDeMembres }, (_, i) =>
    ParticipationTontine.creer({ groupeId: 'g1', membreId: `m${i + 1}`, rang: i + 1 }).valeur!,
  );
  const cotisations: CotisationTontine[] = [];
  const tours: TourTontine[] = [TourTontine.ouvrir({ groupeId: 'g1', numero: 1, montant: CAGNOTTE })];
  const bouffesParMois: string[][] = [];

  for (let mois = 1; mois <= COTISATIONS_PAR_MEMBRE; mois++) {
    for (const p of participations) {
      const c = CotisationTontine.creer({
        participationId: p.membreId,
        groupeId: 'g1',
        membreId: p.membreId,
        numero: mois,
        montant: COTISATION,
        fraisRetrait: 150,
        cleIdempotencePaiement: `${p.membreId}:${mois}`,
      }).valeur!;
      c.confirmer(new Date(), new Date());
      cotisations.push(c);
    }

    const bouffes: string[] = [];
    for (;;) {
      const tour = tours.find((t) => t.statut === 'en_cours');
      const beneficiaire = prochainBeneficiaire(participations);
      if (!tour || !beneficiaire) break;
      const cloture = tour.cloturer({
        beneficiaireMembreId: beneficiaire.membreId,
        caisseDisponible: calculerCaisse(cotisations, tours),
        date: new Date(),
      });
      if (!cloture.succes) break;
      beneficiaire.marquerBeneficiaire(new Date());
      bouffes.push(beneficiaire.membreId);
      if (prochainBeneficiaire(participations)) {
        tours.push(TourTontine.ouvrir({ groupeId: 'g1', numero: tours.length + 1, montant: CAGNOTTE }));
      }
    }
    bouffesParMois.push(bouffes);
  }

  return { participations, bouffesParMois, caisseFinale: calculerCaisse(cotisations, tours) };
}

describe('Simulation d’une vague (domaine)', () => {
  it('avec 5 membres : une bouffe environ tous les 2 mois, par ancienneté, et tout le monde a bouffé au bout de 12 mois', () => {
    const { participations, bouffesParMois, caisseFinale } = simulerVague(5);

    expect(bouffesParMois).toEqual([
      [], // mois 1 : pour DBC
      [], // 25 000
      [], // 50 000
      ['m1'], // 75 000 → reste 20 000
      [],
      ['m2'],
      [],
      ['m3'],
      [],
      ['m4'],
      [],
      ['m5'], // 55 000 → reste 0
    ]);
    expect(participations.every((p) => p.aBouffe)).toBe(true);
    expect(caisseFinale).toBe(0);
  });

  it('avec 11 membres : une bouffe chaque mois à partir du 2e', () => {
    const { bouffesParMois, caisseFinale } = simulerVague(11);
    expect(bouffesParMois[0]).toEqual([]);
    expect(bouffesParMois.slice(1)).toEqual(Array.from({ length: 11 }, (_, i) => [`m${i + 1}`]));
    expect(caisseFinale).toBe(0);
  });
});
