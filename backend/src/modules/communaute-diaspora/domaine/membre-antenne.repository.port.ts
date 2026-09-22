import { MembreAntenne } from './membre-antenne';

export abstract class MembreAntenneRepositoryPort {
  abstract sauvegarder(membreAntenne: MembreAntenne): Promise<MembreAntenne>;
  abstract existeDeja(antenneId: string, membreId: string): Promise<boolean>;
}
