import { GroupeTontine } from './groupe-tontine';

describe('GroupeTontine (domaine)', () => {
  it("s'ouvre avec le statut ouvert et le minimum par défaut (36)", () => {
    const groupe = GroupeTontine.creer({ niveauId: 1 });
    expect(groupe.statut).toBe('ouvert');
    expect(groupe.minMembres).toBe(36);
  });

  it('refuse de démarrer sous le quorum de membres', () => {
    const groupe = GroupeTontine.creer({ niveauId: 1, minMembres: 36 });
    const resultat = groupe.demarrer(35);
    expect(resultat.succes).toBe(false);
    expect(groupe.statut).toBe('ouvert');
  });

  it('démarre dès que le quorum est atteint', () => {
    const groupe = GroupeTontine.creer({ niveauId: 1, minMembres: 36 });
    const resultat = groupe.demarrer(36);
    expect(resultat.succes).toBe(true);
    expect(groupe.statut).toBe('actif');
  });

  it('refuse de redémarrer un groupe déjà actif ou clos', () => {
    const groupe = GroupeTontine.creer({ niveauId: 1, minMembres: 36 });
    groupe.demarrer(36);
    const resultat = groupe.demarrer(36);
    expect(resultat.succes).toBe(false);
  });
});
