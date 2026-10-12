import { Pole } from './pole';

export abstract class PoleRepositoryPort {
  abstract listerTous(): Promise<Pole[]>;
  abstract trouverParId(id: number): Promise<Pole | null>;
  abstract sauvegarder(pole: Pole): Promise<Pole>;
  abstract supprimer(id: number): Promise<void>;
}
