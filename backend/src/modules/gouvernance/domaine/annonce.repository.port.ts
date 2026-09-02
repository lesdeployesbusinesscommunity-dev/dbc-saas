import { Annonce } from './annonce';

export abstract class AnnonceRepositoryPort {
  abstract sauvegarder(annonce: Annonce): Promise<Annonce>;
  abstract listerRecentes(limite: number): Promise<Annonce[]>;
}
