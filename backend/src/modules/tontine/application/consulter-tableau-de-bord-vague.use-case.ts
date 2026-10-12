import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { calculerCaisse } from '../domaine/caisse';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { CotisationTontineRepositoryPort } from '../domaine/cotisation-tontine.repository.port';
import { TourTontine } from '../domaine/tour-tontine';
import { TourTontineRepositoryPort } from '../domaine/tour-tontine.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';

export interface LigneMembreVague {
  membreId: string;
  matricule: string | null;
  rang: number;
  rejointLe: Date;
  cotisationsPayees: number;
  cotisationsAttendues: number;
  enRetard: boolean;
  paiementEnCours: boolean;
  beneficiaireLe: Date | null;
}

export interface TableauDeBordVague {
  groupe: GroupeTontine;
  caisse: number;
  totalVerseDbc: number;
  totalFraisRetrait: number;
  membres: LigneMembreVague[];
  tours: TourTontine[];
}

/**
 * Tableau de bord d'une vague, pour l'administrateur ou son responsable : qui
 * a payé, qui est en retard, qui a bouffé, combien il y a en caisse. Il se met
 * à jour à chaque cotisation confirmée puisqu'il est recalculé à la lecture.
 */
@Injectable()
export class ConsulterTableauDeBordVagueUseCase {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly cotisations: CotisationTontineRepositoryPort,
    private readonly tours: TourTontineRepositoryPort,
    private readonly membres: MembreRepositoryPort,
  ) {}

  /** `responsableMembreId` renseigné : on vérifie que le demandeur est bien le responsable de la vague. */
  async executer(commande: { groupeId: string; responsableMembreId?: string }): Promise<TableauDeBordVague> {
    const groupe = await this.groupes.trouverParId(commande.groupeId);
    if (!groupe) {
      throw new NotFoundException('Vague introuvable');
    }
    if (commande.responsableMembreId !== undefined && groupe.responsableMembreId !== commande.responsableMembreId) {
      throw new ForbiddenException('Vous n’êtes pas le responsable de cette vague');
    }

    const participations = await this.participations.listerParGroupe(groupe.id!);
    const cotisations = await this.cotisations.listerParGroupe(groupe.id!);
    const tours = await this.tours.listerParGroupe(groupe.id!);
    const maintenant = new Date();

    const membres: LigneMembreVague[] = [];
    for (const participation of participations) {
      const siennes = cotisations.filter((c) => c.participationId === participation.id);
      const payees = siennes.filter((c) => c.statut === 'payee').length;
      const attendues = participation.cotisationsAttendues(maintenant);
      const membre = await this.membres.trouverParId(participation.membreId);
      membres.push({
        membreId: participation.membreId,
        matricule: membre?.matricule ?? null,
        rang: participation.rang,
        rejointLe: participation.rejointLe,
        cotisationsPayees: payees,
        cotisationsAttendues: attendues,
        enRetard: payees < attendues,
        paiementEnCours: siennes.some((c) => c.statut === 'en_attente'),
        beneficiaireLe: participation.beneficiaireLe,
      });
    }

    const payees = cotisations.filter((c) => c.statut === 'payee');
    return {
      groupe,
      caisse: calculerCaisse(cotisations, tours),
      totalVerseDbc: payees.filter((c) => c.destination === 'dbc').reduce((total, c) => total + c.montant, 0),
      totalFraisRetrait: payees.reduce((total, c) => total + c.fraisRetrait, 0),
      membres,
      tours,
    };
  }
}
