import { ProgressionLecon } from './progression-lecon';

export abstract class ProgressionLeconRepositoryPort {
  abstract sauvegarder(progression: ProgressionLecon): Promise<ProgressionLecon>;
  abstract trouverParInscriptionEtLecon(inscriptionId: string, leconId: string): Promise<ProgressionLecon | null>;
  /** "Recommencer la formation" : efface l'avancement (pas l'inscription ni ce qui a été gagné). */
  abstract supprimerParInscriptionId(inscriptionId: string): Promise<void>;
  abstract listerParInscriptionId(inscriptionId: string): Promise<ProgressionLecon[]>;
}
