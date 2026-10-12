import { CotisationTontine } from './cotisation-tontine';

export abstract class CotisationTontineRepositoryPort {
  abstract sauvegarder(cotisation: CotisationTontine): Promise<CotisationTontine>;
  abstract trouverParId(id: string): Promise<CotisationTontine | null>;
  abstract trouverParCleIdempotence(cleIdempotence: string): Promise<CotisationTontine | null>;
  /** Cotisations d'un membre dans une vague, par numéro croissant. */
  abstract listerParParticipation(participationId: string): Promise<CotisationTontine[]>;
  abstract listerParGroupe(groupeId: string): Promise<CotisationTontine[]>;
}
