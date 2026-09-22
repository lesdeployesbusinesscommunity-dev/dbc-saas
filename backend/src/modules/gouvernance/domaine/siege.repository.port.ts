import { Siege } from './siege';

export abstract class SiegeRepositoryPort {
  abstract listerTous(): Promise<Siege[]>;
  abstract trouverParId(id: string): Promise<Siege | null>;
  abstract sauvegarder(siege: Siege): Promise<Siege>;
}
