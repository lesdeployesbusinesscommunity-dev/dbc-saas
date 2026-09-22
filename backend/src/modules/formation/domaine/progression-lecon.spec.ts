import { ProgressionLecon } from './progression-lecon';

describe('ProgressionLecon (domaine)', () => {
  it("n'est pas terminée à la création", () => {
    const progression = ProgressionLecon.creer({ inscriptionId: 'i1', leconId: 'l1' });
    expect(progression.terminee).toBe(false);
    expect(progression.termineeLe).toBeNull();
  });

  it('enregistre la date de complétion quand marquée terminée', () => {
    const progression = ProgressionLecon.creer({ inscriptionId: 'i1', leconId: 'l1' });
    progression.marquerTerminee();
    expect(progression.terminee).toBe(true);
    expect(progression.termineeLe).toBeInstanceOf(Date);
  });
});
