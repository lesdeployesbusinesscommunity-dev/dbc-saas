import { Injectable } from '@nestjs/common';
import { PoleRepositoryPort } from '../domaine/pole.repository.port';
import { SiegeRepositoryPort } from '../domaine/siege.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';

export interface SiegeAvecMembre {
  id: string;
  titre: string;
  ordre: number;
  membreId: string | null;
  matricule: string | null;
}

export interface PoleAvecSieges {
  id: number;
  code: string;
  nom: string;
  description: string;
  ordre: number;
  icone: string;
  sieges: SiegeAvecMembre[];
}

/** Cas d'utilisation "Consulter les pôles de gouvernance" (Administrateur). */
@Injectable()
export class ConsulterPolesUseCase {
  constructor(
    private readonly poles: PoleRepositoryPort,
    private readonly sieges: SiegeRepositoryPort,
    private readonly membres: MembreRepositoryPort,
  ) {}

  async executer(): Promise<PoleAvecSieges[]> {
    const [tousPoles, tousSieges, tousMembres] = await Promise.all([
      this.poles.listerTous(),
      this.sieges.listerTous(),
      this.membres.listerTous(),
    ]);

    const membreParId = new Map(tousMembres.map((m) => [m.id, m]));

    return tousPoles.map((pole) => ({
      id: pole.id!,
      code: pole.code,
      nom: pole.nom,
      description: pole.description,
      ordre: pole.ordre,
      icone: pole.icone,
      sieges: tousSieges
        .filter((siege) => siege.poleId === pole.id)
        .sort((a, b) => a.ordre - b.ordre)
        .map((siege) => ({
          id: siege.id!,
          titre: siege.titre,
          ordre: siege.ordre,
          membreId: siege.membreId,
          matricule: siege.membreId ? (membreParId.get(siege.membreId)?.matricule ?? null) : null,
        })),
    }));
  }
}
