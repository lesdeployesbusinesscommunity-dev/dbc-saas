import { Membre } from './membre';
import { HistoriqueNiveauMembre } from './historique-niveau-membre';

export abstract class MembreRepositoryPort {
  abstract sauvegarder(membre: Membre): Promise<Membre>;
  abstract trouverParId(id: string): Promise<Membre | null>;
  abstract trouverParMatricule(matricule: string): Promise<Membre | null>;
  abstract ajouterHistorique(entree: HistoriqueNiveauMembre): Promise<void>;
  /** Numéro séquentiel unique pour le matricule (séquence Postgres — voir AdhesionBootstrap). */
  abstract prochainNumeroSequenceMatricule(): Promise<number>;
}
