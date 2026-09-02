import { ParrainageMlm } from './parrainage-mlm';

describe('ParrainageMlm (domaine)', () => {
  it('crée une racine à profondeur 0', () => {
    const racine = ParrainageMlm.creerRacine('11111111-1111-1111-1111-111111111111');
    expect(racine.profondeur).toBe(0);
    expect(racine.chemin).not.toContain('-');
  });

  it('un sous-parrain étend le chemin du parrain et incrémente la profondeur', () => {
    const racine = ParrainageMlm.creerRacine('11111111-1111-1111-1111-111111111111');
    const enfant = ParrainageMlm.creerSousParrain('22222222-2222-2222-2222-222222222222', racine);
    expect(enfant.profondeur).toBe(1);
    expect(enfant.chemin.startsWith(racine.chemin + '.')).toBe(true);
  });
});
