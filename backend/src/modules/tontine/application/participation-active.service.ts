import { Injectable } from '@nestjs/common';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { COTISATIONS_PAR_MEMBRE, ParticipationTontine } from '../domaine/participation-tontine';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { CotisationTontineRepositoryPort } from '../domaine/cotisation-tontine.repository.port';

export interface ParticipationActive {
  groupe: GroupeTontine;
  participation: ParticipationTontine;
}

/**
 * Un membre participe activement à une vague tant qu'elle est en cours ET
 * qu'il n'a pas à la fois reçu la cagnotte et payé ses 12 cotisations. Un
 * membre qui a tout terminé peut donc rejoindre une nouvelle vague sans
 * attendre la fin de l'ancienne.
 */
@Injectable()
export class ParticipationActiveService {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly cotisations: CotisationTontineRepositoryPort,
  ) {}

  async trouver(membreId: string): Promise<ParticipationActive | null> {
    const participations = await this.participations.listerParMembre(membreId);
    for (const participation of participations) {
      const groupe = await this.groupes.trouverParId(participation.groupeId);
      if (!groupe || groupe.statut !== 'en_cours') {
        continue;
      }
      if (participation.aBouffe) {
        const cotisations = await this.cotisations.listerParParticipation(participation.id!);
        const payees = cotisations.filter((c) => c.statut === 'payee').length;
        if (payees >= COTISATIONS_PAR_MEMBRE) {
          continue;
        }
      }
      return { groupe, participation };
    }
    return null;
  }
}
