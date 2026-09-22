import { Inscription } from './inscription';

describe('Inscription (domaine)', () => {
  it('démarre avec le statut en_cours', () => {
    const inscription = Inscription.creer({ membreId: 'm1', formationId: 'f1' });
    expect(inscription.statut).toBe('en_cours');
  });

  it('passe au statut terminee une fois marquée terminée', () => {
    const inscription = Inscription.creer({ membreId: 'm1', formationId: 'f1' });
    inscription.marquerTerminee();
    expect(inscription.statut).toBe('terminee');
  });
});
