import { ModuleFormation } from './module-formation';

export abstract class ModuleFormationRepositoryPort {
  abstract sauvegarder(module: ModuleFormation): Promise<ModuleFormation>;
  abstract listerParFormationId(formationId: string): Promise<ModuleFormation[]>;
  abstract trouverParId(id: string): Promise<ModuleFormation | null>;
}
