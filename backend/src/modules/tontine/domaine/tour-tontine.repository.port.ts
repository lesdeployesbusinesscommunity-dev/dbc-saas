import { TourTontine } from './tour-tontine';

export abstract class TourTontineRepositoryPort {
  abstract sauvegarder(tour: TourTontine): Promise<TourTontine>;
  abstract trouverParId(id: string): Promise<TourTontine | null>;
  abstract trouverEnCours(groupeId: string): Promise<TourTontine | null>;
  /** Tours d'une vague, par numéro croissant. */
  abstract listerParGroupe(groupeId: string): Promise<TourTontine[]>;
}
