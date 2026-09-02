import { CatalogueActionsCoins } from './catalogue-actions-coins';

export abstract class CatalogueActionsCoinsRepositoryPort {
  abstract trouverParCode(code: string): Promise<CatalogueActionsCoins | null>;
  abstract listerTous(): Promise<CatalogueActionsCoins[]>;
}
