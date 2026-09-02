import { TransactionCoins } from './transaction-coins';

describe('TransactionCoins (domaine)', () => {
  it('calcule le solde après en ajoutant le delta au solde avant', () => {
    const resultat = TransactionCoins.creer({
      membreId: 'm1',
      delta: 100,
      soldeAvant: 50,
      motif: 'test',
      cleIdempotence: 'k1',
    });
    expect(resultat.succes).toBe(true);
    expect(resultat.valeur?.soldeApres).toBe(150);
  });

  it('refuse une transaction qui ferait passer le solde sous zéro', () => {
    const resultat = TransactionCoins.creer({
      membreId: 'm1',
      delta: -100,
      soldeAvant: 50,
      motif: 'test',
      cleIdempotence: 'k1',
    });
    expect(resultat.succes).toBe(false);
  });
});
