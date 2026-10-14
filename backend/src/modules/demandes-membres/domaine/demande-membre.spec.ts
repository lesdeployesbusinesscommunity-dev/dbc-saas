import { DemandeMembre } from './demande-membre';

function demande() {
  return DemandeMembre.deposer({
    membreId: 'm1',
    type: 'level',
    details: { levelKey: 'performer' },
    profil: { name: 'Test Parrain' },
  });
}

describe('DemandeMembre (domaine)', () => {
  it('reconnaît une demande identique encore en attente', () => {
    const d = demande();
    expect(d.estEnAttenteIdentique('level', { levelKey: 'performer' })).toBe(true);
    expect(d.estEnAttenteIdentique('level', { levelKey: 'elite' })).toBe(false);
    expect(d.estEnAttenteIdentique('reward', { levelKey: 'performer' })).toBe(false);
  });

  it('une décision prévient le membre et clôt la demande', () => {
    const d = demande();
    d.decider('validated');
    expect(d.statut).toBe('validated');
    expect(d.aUneDecision).toBe(true);
    expect(d.decisionLueParMembre).toBe(false);
    expect(d.estEnAttenteIdentique('level', { levelKey: 'performer' })).toBe(false);
    expect(() => d.decider('refused')).toThrow();
  });

  it('une demande retirée redevient non lue pour l’administration et ne se décide plus', () => {
    const d = demande();
    d.lueParAdmin = true;
    d.retirer();
    expect(d.statut).toBe('withdrawn');
    expect(d.lueParAdmin).toBe(false);
    expect(d.aUneDecision).toBe(false);
    expect(() => d.decider('validated')).toThrow();
    expect(() => d.retirer()).toThrow();
  });
});
