import { ParticipationTontine } from './participation-tontine';

export abstract class ParticipationTontineRepositoryPort {
  abstract sauvegarder(participation: ParticipationTontine): Promise<ParticipationTontine>;
  abstract trouverParId(id: string): Promise<ParticipationTontine | null>;
  /** Membres d'une vague, par ancienneté (rang croissant). */
  abstract listerParGroupe(groupeId: string): Promise<ParticipationTontine[]>;
  /** Toutes les participations d'un membre, les plus récentes d'abord. */
  abstract listerParMembre(membreId: string): Promise<ParticipationTontine[]>;
}
