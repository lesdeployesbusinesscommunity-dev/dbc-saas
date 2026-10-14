import { normaliserPreferences, PREFERENCES_PAR_DEFAUT } from './preferences-membre';

describe('Préférences du membre (domaine)', () => {
  it('part des valeurs par défaut quand rien n’est enregistré', () => {
    expect(normaliserPreferences(null)).toEqual(PREFERENCES_PAR_DEFAUT);
  });

  it('garde les choix du membre et ignore le reste', () => {
    const preferences = normaliserPreferences({
      privacy: { showWhatsapp: false, inconnu: true },
      notifications: { coins: { whatsapp: true }, inconnu: { email: true } },
      deletionRequested: true,
    });
    expect(preferences.privacy.showWhatsapp).toBe(false);
    expect(preferences.privacy).not.toHaveProperty('inconnu');
    expect(preferences.notifications.coins).toEqual({ email: true, whatsapp: true });
    expect(preferences.notifications).not.toHaveProperty('inconnu');
    expect(preferences).not.toHaveProperty('deletionRequested');
  });
});
