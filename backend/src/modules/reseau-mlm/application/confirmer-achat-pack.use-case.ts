import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AchatPackMlmRepositoryPort } from '../domaine/achat-pack-mlm.repository.port';
import { CommissionMlmRepositoryPort } from '../domaine/commission-mlm.repository.port';
import { ParrainageMlmRepositoryPort } from '../domaine/parrainage-mlm.repository.port';
import { CommissionMlm } from '../domaine/commission-mlm';
import { StrategieParrainageDirect } from '../domaine/strategie-commission';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { PaiementRepositoryPort } from '../../paiements/domaine/paiement.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface ConfirmerAchatCommande {
  achatId: string;
}

/**
 * Cas d'utilisation 5.2 (moitié "confirmer") — appelé une fois le paiement
 * complété (voir POST /paiements/webhook). Remonte le chemin de parrainage
 * et applique les stratégies de commission disponibles — seule la commission
 * de parrainage direct (profondeur 1) est calculable pour l'instant, voir
 * mémoire "Packs Longrich réels" pour la commission de performance (non
 * spécifiée).
 */
@Injectable()
export class ConfirmerAchatPackUseCase {
  private readonly strategieDirecte = new StrategieParrainageDirect();

  constructor(
    private readonly achats: AchatPackMlmRepositoryPort,
    private readonly paiements: PaiementRepositoryPort,
    private readonly parrainages: ParrainageMlmRepositoryPort,
    private readonly commissions: CommissionMlmRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: ConfirmerAchatCommande) {
    const achat = await this.achats.trouverParId(commande.achatId);
    if (!achat) {
      throw new NotFoundException('Achat introuvable');
    }

    const paiement = await this.paiements.trouverParCleIdempotence(achat.cleIdempotencePaiement);
    if (!paiement || paiement.statut !== 'complete') {
      throw new BadRequestException('Le paiement associé n’est pas encore complété');
    }

    const resultat = achat.confirmer();
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const achatConfirme = await this.achats.sauvegarder(achat);

    const membre = await this.membres.trouverParId(achat.membreId);
    const niveauMembre = membre ? await this.niveaux.trouverParId(membre.niveauActuelId) : null;
    const commissionNiveau = niveauMembre?.commissionParrainage ?? 0;

    const ancetres = await this.parrainages.listerAncetres(achat.membreId);
    const commissionsACreer: CommissionMlm[] = [];
    ancetres.forEach((ancetre, index) => {
      const profondeur = index + 1; // distance au membre, pas la profondeur absolue de l'ancêtre
      const montant = this.strategieDirecte.calculer({ profondeur, commissionNiveau });
      if (montant !== null) {
        commissionsACreer.push(
          CommissionMlm.creer({
            achatId: achatConfirme.id!,
            beneficiaireMembreId: ancetre.membreId,
            montant,
            profondeurNiveau: profondeur,
          }),
        );
      }
    });

    const commissionsCreees =
      commissionsACreer.length > 0 ? await this.commissions.sauvegarderPlusieurs(commissionsACreer) : [];

    await this.enregistrerAudit.executer({
      action: 'achat_pack_mlm_confirme',
      typeEntite: 'AchatPackMlm',
      acteurId: null,
      metadonnees: { achatId: achatConfirme.id, membreId: achatConfirme.membreId, commissionsCreees: commissionsCreees.length },
    });

    return { achat: achatConfirme, commissions: commissionsCreees };
  }
}
