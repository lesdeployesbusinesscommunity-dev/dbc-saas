import { ParrainageMlm } from './parrainage-mlm';

export abstract class ParrainageMlmRepositoryPort {
  abstract sauvegarder(parrainage: ParrainageMlm): Promise<ParrainageMlm>;
  abstract trouverParMembreId(membreId: string): Promise<ParrainageMlm | null>;
  /** Remonte le chemin ltree — parents directs et indirects, du plus proche au plus lointain. */
  abstract listerAncetres(membreId: string): Promise<ParrainageMlm[]>;
  /** Filleuls directs (profondeur + 1 uniquement). */
  abstract listerDescendantsDirects(membreId: string): Promise<ParrainageMlm[]>;
}
