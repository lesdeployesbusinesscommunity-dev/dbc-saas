import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CotisationTontine } from '../domaine/cotisation-tontine';
import { CotisationTontineRepositoryPort } from '../domaine/cotisation-tontine.repository.port';
import { COTISATIONS_PAR_MEMBRE } from '../domaine/participation-tontine';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { TourTontine } from '../domaine/tour-tontine';
import { CloturerToursUseCase } from './cloturer-tours.use-case';
import { NotifierMembreTontineService } from './notifier-membre-tontine.service';
import { PaiementRepositoryPort } from '../../paiements/domaine/paiement.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';
import { ReclamerGainCoinsUseCase } from '../../gamification/application/reclamer-gain-coins.use-case';

export type ConfirmerCotisationCommande = { cotisationId: string } | { cleIdempotencePaiement: string };

/**
 * Suite de "Cotiser" (4.3), déclenchée automatiquement par le callback du
 * paiement (voir AbonnementPaiementsTontine) ou, en rattrapage, par
 * l'administrateur. Idempotente : une cotisation déjà payée est renvoyée telle
 * quelle, jamais comptée deux fois.
 *
 * Effets : le responsable de la vague est notifié (tableau de bord +
 * WhatsApp), puis on attribue toutes les cagnottes que la caisse permet
 * désormais de couvrir (4.4). À la 12e cotisation payée sans aucun retard, le
 * membre gagne les DBC Coins "tontine sans échec".
 */
@Injectable()
export class ConfirmerCotisationUseCase {
  private readonly logger = new Logger(ConfirmerCotisationUseCase.name);

  constructor(
    private readonly cotisations: CotisationTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly cloturerTours: CloturerToursUseCase,
    private readonly notifier: NotifierMembreTontineService,
    private readonly paiements: PaiementRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
    private readonly reclamerGainCoins: ReclamerGainCoinsUseCase,
  ) {}

  async executer(
    commande: ConfirmerCotisationCommande,
  ): Promise<{ cotisation: CotisationTontine; toursClotures: TourTontine[] }> {
    const cotisation =
      'cotisationId' in commande
        ? await this.cotisations.trouverParId(commande.cotisationId)
        : await this.cotisations.trouverParCleIdempotence(commande.cleIdempotencePaiement);
    if (!cotisation) {
      throw new NotFoundException('Cotisation introuvable');
    }
    if (cotisation.statut === 'payee') {
      return { cotisation, toursClotures: [] };
    }

    const paiement = await this.paiements.trouverParCleIdempotence(cotisation.cleIdempotencePaiement);
    if (!paiement || paiement.statut !== 'complete') {
      throw new BadRequestException('Le paiement associé n’est pas encore complété');
    }
    const participation = await this.participations.trouverParId(cotisation.participationId);
    const groupe = await this.groupes.trouverParId(cotisation.groupeId);
    if (!participation || !groupe) {
      throw new NotFoundException('Vague ou participation introuvable');
    }

    const resultat = cotisation.confirmer(new Date(), participation.echeance(cotisation.numero));
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const confirmee = await this.cotisations.sauvegarder(cotisation);

    if (groupe.responsableMembreId) {
      const membre = await this.membres.trouverParId(confirmee.membreId);
      await this.notifier.executer({
        destinataireMembreId: groupe.responsableMembreId,
        groupeId: groupe.id!,
        type: 'cotisation_payee',
        message:
          `${membre?.matricule ?? 'Un membre'} a payé sa cotisation ${confirmee.numero}/${COTISATIONS_PAR_MEMBRE} ` +
          `(${confirmee.montant} FCFA) — vague n°${groupe.numero}${confirmee.enRetard ? ', en retard' : ''}.`,
      });
    }

    await this.enregistrerAudit.executer({
      action: 'cotisation_tontine_payee',
      typeEntite: 'CotisationTontine',
      acteurId: null,
      metadonnees: { cotisationId: confirmee.id, groupeId: groupe.id, membreId: confirmee.membreId, numero: confirmee.numero },
    });

    const toursClotures = await this.cloturerTours.executer({ groupeId: groupe.id!, exigerAuMoinsUnTour: false });

    if (confirmee.numero === COTISATIONS_PAR_MEMBRE) {
      await this.recompenserSansEchec(participation.id!, confirmee.membreId);
    }

    return { cotisation: confirmee, toursClotures };
  }

  private async recompenserSansEchec(participationId: string, membreId: string): Promise<void> {
    const payees = (await this.cotisations.listerParParticipation(participationId)).filter((c) => c.statut === 'payee');
    if (payees.length < COTISATIONS_PAR_MEMBRE || payees.some((c) => c.enRetard)) {
      return;
    }
    try {
      await this.reclamerGainCoins.executer({
        membreId,
        codeAction: 'tontine_sans_echec_annuel',
        cleIdempotence: `tontine-sans-echec:${participationId}`,
      });
    } catch (erreur) {
      this.logger.warn(`Coins "tontine sans échec" non attribués à ${membreId} : ${(erreur as Error).message}`);
    }
  }
}
