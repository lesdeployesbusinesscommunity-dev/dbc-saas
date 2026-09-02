import { Paiement } from './paiement';

describe('Paiement (domaine)', () => {
  it('refuse un montant négatif ou nul', () => {
    const resultat = Paiement.creer({ montant: 0, objet: 'test', cleIdempotence: 'k1' });
    expect(resultat.succes).toBe(false);
  });

  it('crée un paiement en_attente par défaut', () => {
    const resultat = Paiement.creer({ montant: 1000, objet: 'cotisation', cleIdempotence: 'k1' });
    expect(resultat.succes).toBe(true);
    expect(resultat.valeur?.statut).toBe('en_attente');
  });

  it('ne peut pas être complété deux fois (idempotence au niveau domaine)', () => {
    const paiement = Paiement.creer({ montant: 1000, objet: 'cotisation', cleIdempotence: 'k1' }).valeur!;
    expect(paiement.marquerComplete().succes).toBe(true);
    expect(paiement.marquerComplete().succes).toBe(false);
  });

  it('ne peut être remboursé que si complete', () => {
    const paiement = Paiement.creer({ montant: 1000, objet: 'cotisation', cleIdempotence: 'k1' }).valeur!;
    expect(paiement.rembourser().succes).toBe(false);
    paiement.marquerComplete();
    expect(paiement.rembourser().succes).toBe(true);
  });
});
