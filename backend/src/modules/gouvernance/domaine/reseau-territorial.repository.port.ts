import { ReseauTerritorial } from './reseau-territorial';

export abstract class ReseauTerritorialRepositoryPort {
  abstract listerTous(): Promise<ReseauTerritorial[]>;
  abstract trouverParPays(pays: string): Promise<ReseauTerritorial | null>;
  abstract sauvegarder(reseau: ReseauTerritorial): Promise<ReseauTerritorial>;
  abstract supprimer(pays: string): Promise<void>;
}
