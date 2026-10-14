import { normaliserParametres, PARAMETRES_PAR_DEFAUT, verifierMotDePasse } from './parametres-plateforme';

describe('Paramètres de la plateforme (domaine)', () => {
  it('complète avec les valeurs par défaut et ignore les champs inconnus', () => {
    const parametres = normaliserParametres({ tontine: { contributionDay: 10 }, inconnu: true });
    expect(parametres.tontine.contributionDay).toBe(10);
    expect(parametres.general).toEqual(PARAMETRES_PAR_DEFAUT.general);
    expect(parametres).not.toHaveProperty('inconnu');
  });

  it('ramène les valeurs dans leurs bornes', () => {
    const parametres = normaliserParametres({
      tontine: { contributionDay: 40, reminderDaysBefore: -2 },
      security: { passwordMinLength: 4, memberIdleMinutes: 7 },
    });
    expect(parametres.tontine.contributionDay).toBe(28);
    expect(parametres.tontine.reminderDaysBefore).toBe(0);
    expect(parametres.security.passwordMinLength).toBe(8);
    expect(parametres.security.memberIdleMinutes).toBe(5);
  });

  it('applique la règle de mot de passe choisie', () => {
    const securite = { ...PARAMETRES_PAR_DEFAUT.security, passwordMinLength: 10, passwordRequireUpper: true };
    expect(verifierMotDePasse('court1A', securite)).toMatch(/10 caractères/);
    expect(verifierMotDePasse('sansmajuscule1', securite)).toMatch(/majuscule/);
    expect(verifierMotDePasse('SansChiffreIci', securite)).toMatch(/chiffre/);
    expect(verifierMotDePasse('Valable2026x', securite)).toBeNull();
  });
});
