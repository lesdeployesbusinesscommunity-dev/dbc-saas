import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TourTontine } from '../domaine/tour-tontine';
import { TourTontineRepositoryPort } from '../domaine/tour-tontine.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

/**
 * L'administrateur indique que la cagnotte attribuée a bien été remise au
 * bénéficiaire. Le versement lui-même se fait hors plateforme : le module
 * Paiements ne gère pour l'instant que les encaissements.
 */
@Injectable()
export class VerserCagnotteUseCase {
  constructor(
    private readonly tours: TourTontineRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: { tourId: string }): Promise<TourTontine> {
    const tour = await this.tours.trouverParId(commande.tourId);
    if (!tour) {
      throw new NotFoundException('Tour introuvable');
    }
    const resultat = tour.marquerVerse(new Date());
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const verse = await this.tours.sauvegarder(tour);

    await this.enregistrerAudit.executer({
      action: 'cagnotte_tontine_versee',
      typeEntite: 'TourTontine',
      acteurId: null,
      metadonnees: { tourId: verse.id, groupeId: verse.groupeId, beneficiaireMembreId: verse.beneficiaireMembreId, montant: verse.montant },
    });

    return verse;
  }
}
