import { TransactionCoins } from './transaction-coins';

export interface LigneClassement {
  membreId: string;
  solde: number;
}

export abstract class TransactionCoinsRepositoryPort {
  abstract sauvegarder(transaction: TransactionCoins): Promise<TransactionCoins>;
  abstract trouverParCleIdempotence(cleIdempotence: string): Promise<TransactionCoins | null>;
  /** Solde courant du membre — 0 si aucune transaction encore. */
  abstract dernierSolde(membreId: string): Promise<number>;
  abstract listerParMembre(membreId: string): Promise<TransactionCoins[]>;
  abstract classement(limite: number): Promise<LigneClassement[]>;
}
