import { Programme } from './programme';

export abstract class ProgrammeRepositoryPort {
  abstract listerTous(): Promise<Programme[]>;
  abstract listerParPilier(pilierCode: string): Promise<Programme[]>;
}
