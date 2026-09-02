import { genererMatricule } from './matricule';

describe('genererMatricule', () => {
  it('respecte le format DBC-AAAA-XXXXX', () => {
    const matricule = genererMatricule(2026, 1);
    expect(matricule).toMatch(/^DBC-2026-\d{5}$/);
  });

  it('est déterministe pour un même numéro de séquence', () => {
    expect(genererMatricule(2026, 42)).toBe(genererMatricule(2026, 42));
  });

  it('produit des matricules différents pour des séquences différentes', () => {
    expect(genererMatricule(2026, 1)).not.toBe(genererMatricule(2026, 2));
  });
});
