import { Antenne } from './antenne';
import { MembreAntenne } from './membre-antenne';

describe('MembreAntenne (domaine)', () => {
  it('refuse de rejoindre une antenne en préparation', () => {
    const antenne = Antenne.depuisPersistance({
      id: 'a1',
      zoneId: 1,
      ville: 'Bafoussam',
      statut: 'preparation',
      leaderMembreId: null,
      coordinateurMembreId: null,
    });
    const resultat = MembreAntenne.rejoindre(antenne, 'm1');
    expect(resultat.succes).toBe(false);
  });

  it('accepte de rejoindre une antenne en lancement', () => {
    const antenne = Antenne.depuisPersistance({
      id: 'a1',
      zoneId: 1,
      ville: 'Yaoundé Centre',
      statut: 'lancement',
      leaderMembreId: null,
      coordinateurMembreId: null,
    });
    const resultat = MembreAntenne.rejoindre(antenne, 'm1');
    expect(resultat.succes).toBe(true);
  });
});
