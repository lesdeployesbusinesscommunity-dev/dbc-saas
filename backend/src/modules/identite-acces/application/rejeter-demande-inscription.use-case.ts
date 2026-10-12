import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DemandeInscription } from '../domaine/demande-inscription';
import { DemandeInscriptionRepositoryPort } from '../domaine/demande-inscription.repository.port';

/** Cas d'utilisation "Rejeter une demande d'inscription" (Administrateur). */
@Injectable()
export class RejeterDemandeInscriptionUseCase {
  constructor(private readonly demandes: DemandeInscriptionRepositoryPort) {}

  async executer(demandeId: string): Promise<DemandeInscription> {
    const demande = await this.demandes.trouverParId(demandeId);
    if (!demande) {
      throw new NotFoundException('Demande d’inscription introuvable');
    }

    const resultat = demande.rejeter();
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }

    return this.demandes.sauvegarder(demande);
  }
}
