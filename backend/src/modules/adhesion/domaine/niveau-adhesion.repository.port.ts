import { NiveauAdhesion } from './niveau-adhesion';

export abstract class NiveauAdhesionRepositoryPort {
  abstract trouverParCode(code: string): Promise<NiveauAdhesion | null>;
  abstract listerTous(): Promise<NiveauAdhesion[]>;
}
