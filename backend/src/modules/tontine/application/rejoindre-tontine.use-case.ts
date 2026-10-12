import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { ParticipationTontine } from '../domaine/participation-tontine';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { InscriptionAttenteTontine } from '../domaine/inscription-attente-tontine';
import { InscriptionAttenteTontineRepositoryPort } from '../domaine/inscription-attente-tontine.repository.port';
import { CotisationTontine } from '../domaine/cotisation-tontine';
import { ParticipationActiveService } from './participation-active.service';
import { AffectationVagueService } from './affectation-vague.service';
import { CotiserUseCase } from './cotiser.use-case';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface RejoindreTontineCommande {
  membreId: string;
  telephone: string;
  /** Vrai : le membre préfère attendre la prochaine vague plutôt qu'entrer dans la plus récente. */
  attendreProchaineVague: boolean;
}

export type ResultatRejoindre =
  | { statut: 'vague'; groupe: GroupeTontine; participation: ParticipationTontine; premiereCotisation: CotisationTontine }
  | { statut: 'liste_attente'; inscription: InscriptionAttenteTontine };

/**
 * Cas d'utilisation 4.2 — inclut "Initier un paiement" (1re cotisation, pour
 * DBC). Le membre entre dans la vague la plus récente de son niveau si elle a
 * encore de la place ; sinon (ou s'il le demande), il est inscrit sur la liste
 * d'attente de la prochaine vague.
 */
@Injectable()
export class RejoindreTontineUseCase {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly attente: InscriptionAttenteTontineRepositoryPort,
    private readonly participationActive: ParticipationActiveService,
    private readonly affectation: AffectationVagueService,
    private readonly cotiser: CotiserUseCase,
    private readonly membres: MembreRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: RejoindreTontineCommande): Promise<ResultatRejoindre> {
    const membre = await this.membres.trouverParId(commande.membreId);
    if (!membre) {
      throw new NotFoundException('Membre introuvable : choisissez d’abord un niveau d’adhésion');
    }
    if (await this.participationActive.trouver(membre.id)) {
      throw new BadRequestException('Vous faites déjà partie d’une vague en cours');
    }
    if (await this.attente.trouverEnAttentePourMembre(membre.id)) {
      throw new BadRequestException('Vous êtes déjà inscrit sur la liste d’attente de la prochaine vague');
    }

    if (!commande.attendreProchaineVague) {
      const plusRecente = (await this.groupes.lister(membre.niveauActuelId)).find((g) => g.statut === 'en_cours');
      if (plusRecente) {
        const membresVague = await this.participations.listerParGroupe(plusRecente.id!);
        if (plusRecente.peutAccueillir(membresVague.length).succes) {
          const participation = await this.affectation.ajouter(plusRecente, membre.id);
          await this.enregistrerAudit.executer({
            action: 'vague_tontine_rejointe',
            typeEntite: 'ParticipationTontine',
            acteurId: membre.id,
            metadonnees: { groupeId: plusRecente.id, rang: participation.rang },
          });
          const { cotisation } = await this.cotiser.executer({ membreId: membre.id, telephone: commande.telephone });
          return { statut: 'vague', groupe: plusRecente, participation, premiereCotisation: cotisation };
        }
      }
    }

    const inscription = await this.attente.sauvegarder(
      InscriptionAttenteTontine.creer({ membreId: membre.id, niveauId: membre.niveauActuelId }),
    );
    return { statut: 'liste_attente', inscription };
  }
}
