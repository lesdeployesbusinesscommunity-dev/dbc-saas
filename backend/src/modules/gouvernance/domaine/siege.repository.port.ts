import { Siege } from './siege';

export abstract class SiegeRepositoryPort {
  abstract listerTous(): Promise<Siege[]>;
  abstract trouverParId(id: string): Promise<Siege | null>;
  abstract listerParPoleId(poleId: number): Promise<Siege[]>;
  abstract sauvegarder(siege: Siege): Promise<Siege>;
  abstract supprimer(id: string): Promise<void>;
}
