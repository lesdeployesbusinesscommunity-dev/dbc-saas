import { PreferencesMembre } from './preferences-membre';

export abstract class PreferencesMembreRepositoryPort {
  /** Préférences enregistrées d'un membre, telles quelles (null s'il n'a rien changé). */
  abstract lire(membreId: string): Promise<unknown | null>;
  /** Préférences enregistrées de tous les membres qui en ont changé. */
  abstract listerToutes(): Promise<Map<string, unknown>>;
  abstract enregistrer(membreId: string, preferences: PreferencesMembre): Promise<void>;
}
