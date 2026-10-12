import { Injectable } from '@nestjs/common';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { ProgressionFormationService } from './progression-formation.service';

/**
 * "Recommencer la formation" : le membre repart de la première leçon. Son
 * avancement est effacé, mais pas ce qu'il a déjà obtenu : la formation reste
 * terminée s'il l'avait finie (certificat et Coins sont acquis), et un quiz de
 * pré-requis réussi le reste.
 */
@Injectable()
export class RecommencerFormationUseCase {
  constructor(
    private readonly suivi: ProgressionFormationService,
    private readonly progressions: ProgressionLeconRepositoryPort,
  ) {}

  async executer(commande: { membreId: string; formationId: string }): Promise<void> {
    const formation = await this.suivi.trouverFormation(commande.formationId);
    const inscription = await this.suivi.inscription(commande.membreId, formation);
    await this.progressions.supprimerParInscriptionId(inscription.id!);
  }
}
