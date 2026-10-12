import { CotisationTontine } from './cotisation-tontine';

function cotisation(numero: number): CotisationTontine {
  return CotisationTontine.creer({
    participationId: 'p1',
    groupeId: 'g1',
    membreId: 'm1',
    numero,
    montant: 5_000,
    fraisRetrait: 150,
    cleIdempotencePaiement: `tontine-cotisation:${numero}`,
  }).valeur!;
}

describe('CotisationTontine (domaine)', () => {
  it('envoie la 1re cotisation à DBC et les suivantes dans la caisse', () => {
    expect(cotisation(1).destination).toBe('dbc');
    expect(cotisation(2).destination).toBe('caisse');
    expect(cotisation(12).destination).toBe('caisse');
  });

  it('fait déposer la cotisation plus les frais de retrait', () => {
    expect(cotisation(2).montantADeposer).toBe(5_150);
  });

  it('refuse un numéro hors de 1 à 12 ou des frais négatifs', () => {
    const base = { participationId: 'p1', groupeId: 'g1', membreId: 'm1', montant: 5_000, cleIdempotencePaiement: 'c' };
    expect(CotisationTontine.creer({ ...base, numero: 13, fraisRetrait: 0 }).succes).toBe(false);
    expect(CotisationTontine.creer({ ...base, numero: 2, fraisRetrait: -1 }).succes).toBe(false);
  });

  it('se marque en retard si payée après son échéance', () => {
    const aLHeure = cotisation(2);
    aLHeure.confirmer(new Date('2026-02-10T00:00:00Z'), new Date('2026-02-10T00:00:00Z'));
    expect(aLHeure.enRetard).toBe(false);

    const enRetard = cotisation(3);
    enRetard.confirmer(new Date('2026-03-11T00:00:00Z'), new Date('2026-03-10T00:00:00Z'));
    expect(enRetard.enRetard).toBe(true);
  });

  it('ne se confirme qu’une fois et ne peut plus échouer ensuite', () => {
    const c = cotisation(2);
    expect(c.confirmer(new Date(), new Date()).succes).toBe(true);
    expect(c.confirmer(new Date(), new Date()).succes).toBe(false);
    expect(c.marquerEchouee().succes).toBe(false);
  });
});
