import { Antenne } from './antenne';

export abstract class AntenneRepositoryPort {
  abstract sauvegarder(antenne: Antenne): Promise<Antenne>;
  abstract trouverParId(id: string): Promise<Antenne | null>;
  abstract listerTous(): Promise<Antenne[]>;
}
