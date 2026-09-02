import { Zone } from './zone';

export abstract class ZoneRepositoryPort {
  abstract listerTous(): Promise<Zone[]>;
}
