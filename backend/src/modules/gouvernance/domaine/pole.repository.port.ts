import { Pole } from './pole';

export abstract class PoleRepositoryPort {
  abstract listerTous(): Promise<Pole[]>;
}
