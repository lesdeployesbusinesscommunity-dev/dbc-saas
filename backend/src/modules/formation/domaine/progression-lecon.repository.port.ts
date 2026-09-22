import { ProgressionLecon } from './progression-lecon';

export abstract class ProgressionLeconRepositoryPort {
  abstract sauvegarder(progression: ProgressionLecon): Promise<ProgressionLecon>;
  abstract trouverParInscriptionEtLecon(inscriptionId: string, leconId: string): Promise<ProgressionLecon | null>;
  abstract listerParInscriptionId(inscriptionId: string): Promise<ProgressionLecon[]>;
}
