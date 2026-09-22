import { Lecon } from './lecon';

export abstract class LeconRepositoryPort {
  abstract sauvegarder(lecon: Lecon): Promise<Lecon>;
  abstract listerParModuleId(moduleFormationId: string): Promise<Lecon[]>;
  abstract trouverParId(id: string): Promise<Lecon | null>;
}
