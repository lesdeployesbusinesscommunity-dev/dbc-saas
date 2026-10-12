import { InscriptionAttenteTontine } from './inscription-attente-tontine';

export abstract class InscriptionAttenteTontineRepositoryPort {
  abstract sauvegarder(inscription: InscriptionAttenteTontine): Promise<InscriptionAttenteTontine>;
  /** Inscriptions en attente d'un niveau (ou de tous si absent), par ordre d'inscription. */
  abstract listerEnAttente(niveauId?: number): Promise<InscriptionAttenteTontine[]>;
  abstract trouverEnAttentePourMembre(membreId: string, niveauId: number): Promise<InscriptionAttenteTontine | null>;
  /** Inscriptions en attente d'un membre, tous niveaux confondus. */
  abstract listerEnAttentePourMembre(membreId: string): Promise<InscriptionAttenteTontine[]>;
}
