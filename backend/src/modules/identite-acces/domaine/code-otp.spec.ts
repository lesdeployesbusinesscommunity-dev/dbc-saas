import { CodeOtp, genererCodeOtp } from './code-otp';

describe('genererCodeOtp', () => {
  it('génère un code à 6 chiffres', () => {
    expect(genererCodeOtp()).toMatch(/^\d{6}$/);
  });
});

describe('CodeOtp (domaine)', () => {
  const creer = () => CodeOtp.creer({ utilisateurId: 'u1', codeHache: 'hache' });

  it('accepte un code correct non expiré', () => {
    const code = creer();
    expect(code.verifierEtConsommer(true).succes).toBe(true);
    expect(code.consomme).toBe(true);
  });

  it('refuse un code incorrect et incrémente les tentatives', () => {
    const code = creer();
    const resultat = code.verifierEtConsommer(false);
    expect(resultat.succes).toBe(false);
    expect(code.tentatives).toBe(1);
    expect(code.consomme).toBe(false);
  });

  it('bloque après 3 tentatives incorrectes', () => {
    const code = creer();
    code.verifierEtConsommer(false);
    code.verifierEtConsommer(false);
    code.verifierEtConsommer(false);
    const quatrieme = code.verifierEtConsommer(true);
    expect(quatrieme.succes).toBe(false);
  });

  it('refuse un code déjà consommé', () => {
    const code = creer();
    code.verifierEtConsommer(true);
    expect(code.verifierEtConsommer(true).succes).toBe(false);
  });

  it('refuse un code expiré', () => {
    const code = CodeOtp.depuisPersistance({
      id: '1',
      utilisateurId: 'u1',
      codeHache: 'hache',
      expireLe: new Date(Date.now() - 1000),
      tentatives: 0,
      consomme: false,
    });
    expect(code.verifierEtConsommer(true).succes).toBe(false);
  });
});
