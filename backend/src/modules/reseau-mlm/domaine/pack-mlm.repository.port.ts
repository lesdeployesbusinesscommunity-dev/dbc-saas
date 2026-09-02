import { PackMlm } from './pack-mlm';

export abstract class PackMlmRepositoryPort {
  abstract trouverParCode(code: string): Promise<PackMlm | null>;
  abstract trouverParId(id: number): Promise<PackMlm | null>;
  abstract listerTous(): Promise<PackMlm[]>;
}
