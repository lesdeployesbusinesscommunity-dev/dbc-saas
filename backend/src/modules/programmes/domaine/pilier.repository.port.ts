import { Pilier } from './pilier';

export abstract class PilierRepositoryPort {
  abstract listerTous(): Promise<Pilier[]>;
}
