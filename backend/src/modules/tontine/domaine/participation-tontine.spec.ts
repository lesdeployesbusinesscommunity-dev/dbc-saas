import { ajouterMois } from './calendrier';
import { ParticipationTontine, prochainBeneficiaire } from './participation-tontine';

function participation(rang: number, rejointLe = new Date('2026-01-31T10:00:00Z')): ParticipationTontine {
  return ParticipationTontine.creer({ groupeId: 'g1', membreId: `m${rang}`, rang, rejointLe }).valeur!;
}

describe('ajouterMois', () => {
  it('borne au dernier jour du mois cible', () => {
    expect(ajouterMois(new Date('2026-01-31T10:00:00Z'), 1).toISOString()).toBe('2026-02-28T10:00:00.000Z');
    expect(ajouterMois(new Date('2026-01-15T10:00:00Z'), 11).toISOString()).toBe('2026-12-15T10:00:00.000Z');
  });
});

describe('ParticipationTontine (domaine)', () => {
  it('refuse un rang hors de 1 à 11', () => {
    expect(ParticipationTontine.creer({ groupeId: 'g1', membreId: 'm', rang: 0 }).succes).toBe(false);
    expect(ParticipationTontine.creer({ groupeId: 'g1', membreId: 'm', rang: 12 }).succes).toBe(false);
  });

  it('doit sa 1re cotisation dès son entrée, puis une par mois, 12 au total', () => {
    const p = participation(1, new Date('2026-01-10T00:00:00Z'));
    expect(p.cotisationsAttendues(new Date('2026-01-10T00:00:00Z'))).toBe(1);
    expect(p.cotisationsAttendues(new Date('2026-02-09T00:00:00Z'))).toBe(1);
    expect(p.cotisationsAttendues(new Date('2026-02-10T00:00:00Z'))).toBe(2);
    expect(p.cotisationsAttendues(new Date('2030-01-01T00:00:00Z'))).toBe(12);
  });

  it('ne peut recevoir la cagnotte qu’une seule fois', () => {
    const p = participation(1);
    expect(p.marquerBeneficiaire(new Date()).succes).toBe(true);
    expect(p.marquerBeneficiaire(new Date()).succes).toBe(false);
  });

  it('fait passer le plus ancien de la vague qui n’a pas encore bouffé', () => {
    const [p1, p2, p3] = [participation(1), participation(2), participation(3)];
    expect(prochainBeneficiaire([p3, p2, p1])).toBe(p1);
    p1.marquerBeneficiaire(new Date());
    expect(prochainBeneficiaire([p3, p2, p1])).toBe(p2);
    p2.marquerBeneficiaire(new Date());
    p3.marquerBeneficiaire(new Date());
    expect(prochainBeneficiaire([p1, p2, p3])).toBeNull();
  });
});
