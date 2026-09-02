import { Paiement } from './paiement';

/**
 * Port (interface) défini par le domaine. L'infrastructure (Postgres, ou un
 * faux en mémoire pour les tests) doit s'y conformer — jamais l'inverse.
 */
export abstract class PaiementRepositoryPort {
  abstract sauvegarder(paiement: Paiement): Promise<Paiement>;
  abstract trouverParCleIdempotence(cleIdempotence: string): Promise<Paiement | null>;
}
