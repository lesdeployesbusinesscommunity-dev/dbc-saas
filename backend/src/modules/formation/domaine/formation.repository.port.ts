import { Formation } from './formation';

export abstract class FormationRepositoryPort {
  abstract sauvegarder(formation: Formation): Promise<Formation>;
  abstract listerToutes(): Promise<Formation[]>;
  abstract trouverParId(id: string): Promise<Formation | null>;
}
