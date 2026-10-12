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
 * Un membre peut cotiser à plusieurs niveaux en même temps, avec une seule
 * vague active PAR NIVEAU (règle décidée avec l'équipe DBC). Il participe
 * activement à une vague tant qu'elle est en cours ET qu'il n'a pas à la fois
 * reçu la cagnotte et payé ses 12 cotisations : un membre qui a tout terminé
 * peut rejoindre une nouvelle vague de ce niveau sans attendre la fin de
 * l'ancienne.
 */
@Injectable()
export class ParticipationActiveService {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly cotisations: CotisationTontineRepositoryPort,
  ) {}

  /** Toutes les participations actives du membre, une par niveau au plus. */
  async lister(membreId: string): Promise<ParticipationActive[]> {
    const actives: ParticipationActive[] = [];
    for (const participation of await this.participations.listerParMembre(membreId)) {
      const groupe = await this.groupes.trouverParId(participation.groupeId);
      if (!groupe || groupe.statut !== 'en_cours') {
        continue;
      }
      if (participation.aBouffe) {
        const cotisations = await this.cotisations.listerParParticipation(participation.id!);
        if (cotisations.filter((c) => c.statut === 'payee').length >= COTISATIONS_PAR_MEMBRE) {
          continue;
        }
      }
      actives.push({ groupe, participation });
    }
    return actives;
  }

  async trouver(membreId: string, niveauId: number): Promise<ParticipationActive | null> {
    return (await this.lister(membreId)).find((active) => active.groupe.niveauId === niveauId) ?? null;
  }
}
