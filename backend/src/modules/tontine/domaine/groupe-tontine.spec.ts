import { GroupeTontine, MEMBRES_MAXIMUM_PAR_VAGUE } from './groupe-tontine';

function nouvelleVague(): GroupeTontine {
  return GroupeTontine.creer({ niveauId: 1, numero: 1, cotisationMensuelle: 5_000, montantCagnotte: 55_000 }).valeur!;
}

describe('GroupeTontine (domaine)', () => {
  it('démarre en cours, sans minimum de membres', () => {
    const vague = nouvelleVague();
    expect(vague.statut).toBe('en_cours');
    expect(vague.peutAccueillir(0).succes).toBe(true);
  });

  it('refuse une cotisation ou une cagnotte nulle', () => {
    const resultat = GroupeTontine.creer({ niveauId: 1, numero: 1, cotisationMensuelle: 0, montantCagnotte: 55_000 });
    expect(resultat.succes).toBe(false);
  });

  it('accepte jusqu’à 11 membres, pas un de plus', () => {
    const vague = nouvelleVague();
    expect(MEMBRES_MAXIMUM_PAR_VAGUE).toBe(11);
    expect(vague.peutAccueillir(10).succes).toBe(true);
    expect(vague.peutAccueillir(11).succes).toBe(false);
  });

  it('n’accueille plus personne une fois terminée', () => {
    const vague = nouvelleVague();
    vague.terminer();
    expect(vague.peutAccueillir(3).succes).toBe(false);
    expect(vague.terminer().succes).toBe(false);
    expect(vague.designerResponsable('m1').succes).toBe(false);
  });
});
