import { Utilisateur } from './utilisateur';

/**
 * Port (interface) défini par le domaine. L'infrastructure (Postgres, ou un
 * faux en mémoire pour les tests) doit s'y conformer — jamais l'inverse.
 */
export abstract class UtilisateurRepositoryPort {
  abstract sauvegarder(utilisateur: Utilisateur): Promise<Utilisateur>;
  abstract trouverParTelephone(telephone: string): Promise<Utilisateur | null>;
  abstract trouverParId(id: string): Promise<Utilisateur | null>;
}
