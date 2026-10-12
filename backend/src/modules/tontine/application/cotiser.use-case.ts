import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CotisationTontine, PREFIXE_CLE_PAIEMENT_COTISATION } from '../domaine/cotisation-tontine';
import { CotisationTontineRepositoryPort } from '../domaine/cotisation-tontine.repository.port';
import { COTISATIONS_PAR_MEMBRE } from '../domaine/participation-tontine';
import { FraisRetraitTontineRepositoryPort } from '../domaine/frais-retrait-tontine.repository.port';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { ParticipationActiveService } from './participation-active.service';
import { ConfirmerCotisationUseCase } from './confirmer-cotisation.use-case';
import { InitierPaiementUseCase } from '../../paiements/application/initier-paiement.use-case';
import { PaiementRepositoryPort } from '../../paiements/domaine/paiement.repository.port';

export interface CotiserCommande {
  membreId: string;
  telephone: string;
  /** Niveau de la vague pour laquelle on cotise (un membre peut en avoir plusieurs). */
  niveauId: number;
}

/**
 * Cas d'utilisation 4.3 — initie le paiement de la prochaine cotisation du
 * membre (cotisation + frais de retrait du niveau). La confirmation arrive
 * avec le callback du fournisseur — voir ConfirmerCotisationUseCase.
 *
 * Une seule cotisation peut être en attente à la fois : tant que son paiement
 * est en cours on la renvoie telle quelle (jamais deux prélèvements) ; s'il a
 * échoué, on la marque échouée et on en initie une nouvelle.
 */
@Injectable()
export class CotiserUseCase {
  constructor(
    private readonly cotisations: CotisationTontineRepositoryPort,
    private readonly frais: FraisRetraitTontineRepositoryPort,
    private readonly participationActive: ParticipationActiveService,
    private readonly confirmerCotisation: ConfirmerCotisationUseCase,
    private readonly initierPaiement: InitierPaiementUseCase,
    private readonly paiements: PaiementRepositoryPort,
  ) {}

  async executer(commande: CotiserCommande): Promise<{ cotisation: CotisationTontine; groupe: GroupeTontine }> {
    const active = await this.participationActive.trouver(commande.membreId, commande.niveauId);
    if (!active) {
      throw new NotFoundException('Vous ne faites partie d’aucune vague en cours à ce niveau');
    }
    const { groupe, participation } = active;

    const existantes = await this.cotisations.listerParParticipation(participation.id!);
    const enAttente = existantes.find((c) => c.statut === 'en_attente');
    if (enAttente) {
      const paiement = await this.paiements.trouverParCleIdempotence(enAttente.cleIdempotencePaiement);
      if (paiement?.statut === 'complete') {
        // Le callback est arrivé mais la confirmation n'a pas abouti : on la rejoue, puis on reprend.
        await this.confirmerCotisation.executer({ cotisationId: enAttente.id! });
        return this.executer(commande);
      }
      if (paiement?.statut !== 'echoue') {
        return { cotisation: enAttente, groupe };
      }
      enAttente.marquerEchouee();
      await this.cotisations.sauvegarder(enAttente);
    }

    const payees = existantes.filter((c) => c.statut === 'payee').length;
    if (payees >= COTISATIONS_PAR_MEMBRE) {
      throw new BadRequestException(`Vous avez déjà payé vos ${COTISATIONS_PAR_MEMBRE} cotisations dans cette vague`);
    }

    const fraisNiveau = await this.frais.trouverParNiveau(groupe.niveauId);
    const resultat = CotisationTontine.creer({
      participationId: participation.id!,
      groupeId: groupe.id!,
      membreId: commande.membreId,
      numero: payees + 1,
      montant: groupe.cotisationMensuelle,
      fraisRetrait: fraisNiveau?.montant ?? 0,
      cleIdempotencePaiement: `${PREFIXE_CLE_PAIEMENT_COTISATION}${randomUUID()}`,
    });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const cotisation = await this.cotisations.sauvegarder(resultat.valeur!);

    await this.initierPaiement.executer({
      montant: cotisation.montantADeposer,
      objet: `Cotisation tontine ${cotisation.numero}/${COTISATIONS_PAR_MEMBRE} — vague n°${groupe.numero}`,
      telephone: commande.telephone,
      cleIdempotence: cotisation.cleIdempotencePaiement,
    });

    return { cotisation, groupe };
  }
}
