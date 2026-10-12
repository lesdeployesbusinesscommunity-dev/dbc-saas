import { FraisRetraitTontine } from './frais-retrait-tontine';

export abstract class FraisRetraitTontineRepositoryPort {
  abstract sauvegarder(frais: FraisRetraitTontine): Promise<FraisRetraitTontine>;
  abstract trouverParNiveau(niveauId: number): Promise<FraisRetraitTontine | null>;
  abstract listerTous(): Promise<FraisRetraitTontine[]>;
}
