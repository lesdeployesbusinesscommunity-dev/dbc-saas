import { calculerCalendrierVague } from './calendrier-vague';

const ouverteLe = new Date('2026-01-10T09:00:00Z');

function participants(nombre: number) {
  return Array.from({ length: nombre }, (_, i) => ({
    membreId: `m${i + 1}`,
    rang: i + 1,
    beneficiaireLe: null,
    cotisationsCaisseRestantes: 11,
  }));
}

describe('calculerCalendrierVague (domaine)', () => {
  it('projette les bouffes d’une vague de 5 membres qui vient d’ouvrir', () => {
    const calendrier = calculerCalendrierVague({
      ouverteLe,
      maintenant: new Date('2026-01-20T00:00:00Z'),
      cagnotte: 55_000,
      cotisationMensuelle: 5_000,
      caisseActuelle: 0,
      participants: participants(5),
    });

    expect(calendrier[0]).toMatchObject({ numero: 1, statut: 'current', pourDbc: true, beneficiaires: [] });
    const bouffes = calendrier.filter((mois) => mois.beneficiaires.length > 0).map((mois) => [mois.numero, mois.beneficiaires]);
    expect(bouffes).toEqual([
      [4, ['m1']],
      [6, ['m2']],
      [8, ['m3']],
      [10, ['m4']],
      [12, ['m5']],
    ]);
    expect(calendrier).toHaveLength(12);
  });

  it('montre les bouffes réelles du passé et projette la suite', () => {
    const calendrier = calculerCalendrierVague({
      ouverteLe,
      maintenant: new Date('2026-03-15T00:00:00Z'),
      cagnotte: 55_000,
      cotisationMensuelle: 5_000,
      caisseActuelle: 0,
      participants: [
        { membreId: 'm1', rang: 1, beneficiaireLe: new Date('2026-02-20T00:00:00Z'), cotisationsCaisseRestantes: 9 },
        ...Array.from({ length: 10 }, (_, i) => ({
          membreId: `m${i + 2}`,
          rang: i + 2,
          beneficiaireLe: null,
          cotisationsCaisseRestantes: 9,
        })),
      ],
    });

    expect(calendrier.slice(0, 3).map((mois) => mois.statut)).toEqual(['closed', 'closed', 'current']);
    expect(calendrier[1]).toMatchObject({ beneficiaires: ['m1'], projete: false });
    expect(calendrier[3]).toMatchObject({ statut: 'upcoming', beneficiaires: ['m2'], projete: true });
  });
});
