import { DemandeInscription } from './demande-inscription';

export abstract class DemandeInscriptionRepositoryPort {
  abstract sauvegarder(demande: DemandeInscription): Promise<DemandeInscription>;
  abstract trouverParId(id: string): Promise<DemandeInscription | null>;
  /** Demande validée à l'origine d'un compte (DemandeInscription.utilisateurId). */
  abstract trouverParUtilisateurId(utilisateurId: string): Promise<DemandeInscription | null>;
  abstract trouverEnAttenteParTelephone(telephone: string): Promise<DemandeInscription | null>;
  abstract listerEnAttente(): Promise<DemandeInscription[]>;
  abstract listerToutes(): Promise<DemandeInscription[]>;
}
