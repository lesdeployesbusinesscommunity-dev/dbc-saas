import { Injectable } from '@nestjs/common';
import { normaliserPreferences, PreferencesMembre } from '../domaine/preferences-membre';
import { PreferencesMembreRepositoryPort } from '../domaine/preferences-membre.repository.port';

/** Paramètres > Notifications et Confidentialité de l'espace membre. */
@Injectable()
export class PreferencesMembreService {
  constructor(private readonly depot: PreferencesMembreRepositoryPort) {}

  async lire(membreId: string): Promise<PreferencesMembre> {
    return normaliserPreferences(await this.depot.lire(membreId));
  }

  async enregistrer(membreId: string, brut: unknown): Promise<PreferencesMembre> {
    const preferences = normaliserPreferences(brut);
    await this.depot.enregistrer(membreId, preferences);
    return preferences;
  }
}
