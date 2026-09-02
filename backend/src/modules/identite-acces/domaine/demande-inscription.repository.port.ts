import { DemandeInscription } from './demande-inscription';

export abstract class DemandeInscriptionRepositoryPort {
  abstract sauvegarder(demande: DemandeInscription): Promise<DemandeInscription>;
  abstract trouverParId(id: string): Promise<DemandeInscription | null>;
  abstract trouverEnAttenteParTelephone(telephone: string): Promise<DemandeInscription | null>;
  abstract listerEnAttente(): Promise<DemandeInscription[]>;
}
