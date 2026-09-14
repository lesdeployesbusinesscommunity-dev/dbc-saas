import { Inscription } from './inscription';

export abstract class InscriptionRepositoryPort {
  abstract sauvegarder(inscription: Inscription): Promise<Inscription>;
  abstract trouverParId(id: string): Promise<Inscription | null>;
  abstract trouverParMembreEtFormation(membreId: string, formationId: string): Promise<Inscription | null>;
}
