import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { calculerCaisse } from '../domaine/caisse';
import { COTISATIONS_PAR_MEMBRE, prochainBeneficiaire } from '../domaine/participation-tontine';
import { TourTontine } from '../domaine/tour-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { CotisationTontineRepositoryPort } from '../domaine/cotisation-tontine.repository.port';
import { TourTontineRepositoryPort } from '../domaine/tour-tontine.repository.port';
import { NotifierMembreTontineService } from './notifier-membre-tontine.service';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface CloturerToursCommande {
  groupeId: string;
  /** Vrai pour un déclenchement manuel : on signale une erreur si la caisse ne suffit pas. */
  exigerAuMoinsUnTour: boolean;
}

/**
 * Cas d'utilisation 4.4 — "Clôturer un tour". Tant que la caisse couvre la
 * cagnotte, le tour en cours est clôturé au profit du plus ancien membre qui
 * n'a pas encore bouffé, et le tour suivant s'ouvre. Appelé automatiquement à
 * chaque cotisation confirmée (Système) ou manuellement (Administrateur).
 *
 * La vague se termine quand tous ses membres ont bouffé et payé leurs 12
 * cotisations.
 */
@Injectable()
export class CloturerToursUseCase {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly cotisations: CotisationTontineRepositoryPort,
    private readonly tours: TourTontineRepositoryPort,
    private readonly notifier: NotifierMembreTontineService,
    private readonly membres: MembreRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: CloturerToursCommande): Promise<TourTontine[]> {
    const groupe = await this.groupes.trouverParId(commande.groupeId);
    if (!groupe) {
      throw new NotFoundException('Vague introuvable');
    }
    if (groupe.statut !== 'en_cours') {
      if (commande.exigerAuMoinsUnTour) {
        throw new BadRequestException('Cette vague est terminée');
      }
      return [];
    }

    const participations = await this.participations.listerParGroupe(groupe.id!);
    const cotisations = await this.cotisations.listerParGroupe(groupe.id!);
    const tours = await this.tours.listerParGroupe(groupe.id!);
    const clotures: TourTontine[] = [];

    for (;;) {
      const tourEnCours = tours.find((t) => t.statut === 'en_cours');
      const beneficiaire = prochainBeneficiaire(participations);
      if (!tourEnCours || !beneficiaire) {
        break;
      }

      const maintenant = new Date();
      const resultat = tourEnCours.cloturer({
        beneficiaireMembreId: beneficiaire.membreId,
        caisseDisponible: calculerCaisse(cotisations, tours),
        date: maintenant,
      });
      if (!resultat.succes) {
        if (commande.exigerAuMoinsUnTour && clotures.length === 0) {
          throw new BadRequestException(resultat.erreur);
        }
        break;
      }
      await this.tours.sauvegarder(tourEnCours);
      beneficiaire.marquerBeneficiaire(maintenant);
      await this.participations.sauvegarder(beneficiaire);
      clotures.push(tourEnCours);

      await this.prevenir(groupe.id!, groupe.numero, groupe.responsableMembreId, beneficiaire.membreId, tourEnCours.montant);
      await this.enregistrerAudit.executer({
        action: 'tour_tontine_cloture',
        typeEntite: 'TourTontine',
        acteurId: null,
        metadonnees: { tourId: tourEnCours.id, groupeId: groupe.id, beneficiaireMembreId: beneficiaire.membreId },
      });

      if (prochainBeneficiaire(participations)) {
        tours.push(
          await this.tours.sauvegarder(
            TourTontine.ouvrir({ groupeId: groupe.id!, numero: tours.length + 1, montant: groupe.montantCagnotte }),
          ),
        );
      }
    }

    const toutPaye = participations.every(
      (p) =>
        cotisations.filter((c) => c.participationId === p.id && c.statut === 'payee').length >= COTISATIONS_PAR_MEMBRE,
    );
    if (participations.length > 0 && participations.every((p) => p.aBouffe) && toutPaye) {
      groupe.terminer();
      await this.groupes.sauvegarder(groupe);
    }

    return clotures;
  }

  private async prevenir(
    groupeId: string,
    numeroVague: number,
    responsableMembreId: string | null,
    beneficiaireMembreId: string,
    montant: number,
  ): Promise<void> {
    await this.notifier.executer({
      destinataireMembreId: beneficiaireMembreId,
      groupeId,
      type: 'cagnotte_attribuee',
      message: `C'est votre tour ! La cagnotte de ${montant} FCFA de la vague n°${numeroVague} vous est attribuée.`,
    });
    if (responsableMembreId && responsableMembreId !== beneficiaireMembreId) {
      const beneficiaire = await this.membres.trouverParId(beneficiaireMembreId);
      await this.notifier.executer({
        destinataireMembreId: responsableMembreId,
        groupeId,
        type: 'cagnotte_attribuee',
        message: `La caisse couvre la cagnotte : ${beneficiaire?.matricule ?? 'un membre'} doit recevoir ${montant} FCFA (vague n°${numeroVague}).`,
      });
    }
  }
}
