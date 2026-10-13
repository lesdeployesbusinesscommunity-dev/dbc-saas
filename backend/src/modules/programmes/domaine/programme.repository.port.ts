import { Programme } from './programme';

export abstract class ProgrammeRepositoryPort {
  abstract listerTous(): Promise<Programme[]>;
  abstract listerParPilier(pilierCode: string): Promise<Programme[]>;
  abstract trouverParCode(code: string): Promise<Programme | null>;
  abstract sauvegarder(programme: Programme): Promise<Programme>;
  abstract supprimer(code: string): Promise<void>;
}
