import { TourTontine } from './tour-tontine';

describe('TourTontine (domaine)', () => {
  it('refuse de clôturer si la caisse ne couvre pas la cagnotte', () => {
    const tour = TourTontine.ouvrir({ groupeId: 'g1', numero: 1, montant: 55_000 });
    const resultat = tour.cloturer({ beneficiaireMembreId: 'm1', caisseDisponible: 54_999, date: new Date() });
    expect(resultat.succes).toBe(false);
    expect(tour.statut).toBe('en_cours');
  });

  it('suit en_cours → a_verser → verse', () => {
    const tour = TourTontine.ouvrir({ groupeId: 'g1', numero: 1, montant: 55_000 });
    expect(tour.marquerVerse(new Date()).succes).toBe(false);
    expect(tour.cloturer({ beneficiaireMembreId: 'm1', caisseDisponible: 55_000, date: new Date() }).succes).toBe(true);
    expect(tour.statut).toBe('a_verser');
    expect(tour.beneficiaireMembreId).toBe('m1');
    expect(tour.cloturer({ beneficiaireMembreId: 'm2', caisseDisponible: 999_999, date: new Date() }).succes).toBe(false);
    expect(tour.marquerVerse(new Date()).succes).toBe(true);
    expect(tour.statut).toBe('verse');
  });
});
