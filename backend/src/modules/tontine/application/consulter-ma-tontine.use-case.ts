import { Injectable } from '@nestjs/common';
import { calculerCaisse } from '../domaine/caisse';
import { CotisationTontine } from '../domaine/cotisation-tontine';
import { CotisationTontineRepositoryPort } from '../domaine/cotisation-tontine.repository.port';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { InscriptionAttenteTontine } from '../domaine/inscription-attente-tontine';
import { InscriptionAttenteTontineRepositoryPort } from '../domaine/inscription-attente-tontine.repository.port';
import { COTISATIONS_PAR_MEMBRE, ParticipationTontine } from '../domaine/participation-tontine';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { TourTontineRepositoryPort } from '../domaine/tour-tontine.repository.port';
import { FraisRetraitTontineRepositoryPort } from '../domaine/frais-retrait-tontine.repository.port';
import { ParticipationActiveService } from './participation-active.service';

export interface MaVague {
  groupe: GroupeTontine;
  participation: ParticipationTontine;
  cotisations: CotisationTontine[];
  cotisationsPayees: number;
  cotisationsAttendues: number;
  enRetard: boolean;
  /** Prochaine échéance, ou null si les 12 cotisations sont payées. */
  prochaineEcheance: Date | null;
  /** Montant à déposer pour la prochaine cotisation (cotisation + frais de retrait). */
  montantProchainDepot: number;
  /** Nombre de membres qui bouffent avant moi (0 = je suis le prochain), null si j'ai déjà bouffé. */
  membresAvantMoi: number | null;
  caisse: number;
}

/** Cas d'utilisation 4.5 — "Consulter ma tontine". */
@Injectable()
export class ConsulterMaTontineUseCase {
  constructor(
    private readonly participationActive: ParticipationActiveService,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly cotisations: CotisationTontineRepositoryPort,
    private readonly tours: TourTontineRepositoryPort,
    private readonly frais: FraisRetraitTontineRepositoryPort,
    private readonly attente: InscriptionAttenteTontineRepositoryPort,
  ) {}

  async executer(membreId: string): Promise<{ vague: MaVague | null; listeAttente: InscriptionAttenteTontine | null }> {
    const listeAttente = await this.attente.trouverEnAttentePourMembre(membreId);
    const active = await this.participationActive.trouver(membreId);
    if (!active) {
      return { vague: null, listeAttente };
    }
    const { groupe, participation } = active;

    const cotisationsVague = await this.cotisations.listerParGroupe(groupe.id!);
    const tours = await this.tours.listerParGroupe(groupe.id!);
    const membresVague = await this.participations.listerParGroupe(groupe.id!);
    const fraisNiveau = await this.frais.trouverParNiveau(groupe.niveauId);

    const miennes = cotisationsVague.filter((c) => c.participationId === participation.id);
    const payees = miennes.filter((c) => c.statut === 'payee').length;
    const attendues = participation.cotisationsAttendues(new Date());

    return {
      listeAttente,
      vague: {
        groupe,
        participation,
        cotisations: miennes,
        cotisationsPayees: payees,
        cotisationsAttendues: attendues,
        enRetard: payees < attendues,
        prochaineEcheance: payees < COTISATIONS_PAR_MEMBRE ? participation.echeance(payees + 1) : null,
        montantProchainDepot: groupe.cotisationMensuelle + (fraisNiveau?.montant ?? 0),
        membresAvantMoi: participation.aBouffe
          ? null
          : membresVague.filter((m) => !m.aBouffe && m.rang < participation.rang).length,
        caisse: calculerCaisse(cotisationsVague, tours),
      },
    };
  }
}
