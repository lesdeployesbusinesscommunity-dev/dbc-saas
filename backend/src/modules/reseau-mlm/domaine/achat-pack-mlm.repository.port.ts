import { AchatPackMlm } from './achat-pack-mlm';

export abstract class AchatPackMlmRepositoryPort {
  abstract sauvegarder(achat: AchatPackMlm): Promise<AchatPackMlm>;
  abstract trouverParId(id: string): Promise<AchatPackMlm | null>;
}
