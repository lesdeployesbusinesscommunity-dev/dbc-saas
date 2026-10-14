import { DemandeMembre } from './demande-membre';

export abstract class DemandeMembreRepositoryPort {
  abstract sauvegarder(demande: DemandeMembre): Promise<DemandeMembre>;
  abstract trouverParId(id: string): Promise<DemandeMembre | null>;
  /** Toutes les demandes, les plus récentes d'abord. */
  abstract listerToutes(): Promise<DemandeMembre[]>;
  /** Demandes d'un membre, les plus récentes d'abord. */
  abstract listerParMembre(membreId: string): Promise<DemandeMembre[]>;
}
