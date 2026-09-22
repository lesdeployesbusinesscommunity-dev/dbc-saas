import { Injectable } from '@nestjs/common';
import { ParrainageMlmRepositoryPort } from '../domaine/parrainage-mlm.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

export interface NoeudReseauGlobal {
  membreId: string;
  matricule: string;
  niveauId: number;
  niveauNom: string;
  parentMembreId: string | null;
  profondeur: number;
}

/**
 * Vue de lecture pour le back-office (arbre de parrainage complet). Le
 * chemin ltree de chaque parrainage encode déjà la hiérarchie : le parent
 * d'un nœud est celui dont le chemin est ce même chemin moins son dernier
 * segment — pas besoin de "remonter" le segment ltree vers un membreId
 * (non réversible, voir segmentLtree), juste de comparer les chemins entre
 * eux.
 */
@Injectable()
export class ConsulterReseauGlobalUseCase {
  constructor(
    private readonly parrainages: ParrainageMlmRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async executer(): Promise<NoeudReseauGlobal[]> {
    const [tousParrainages, tousMembres, tousNiveaux] = await Promise.all([
      this.parrainages.listerTous(),
      this.membres.listerTous(),
      this.niveaux.listerTous(),
    ]);

    const cheminVersMembreId = new Map(tousParrainages.map((p) => [p.chemin, p.membreId]));
    const membreParId = new Map(tousMembres.map((m) => [m.id, m]));
    const niveauParId = new Map(tousNiveaux.map((n) => [n.id, n]));

    return tousParrainages.map((parrainage) => {
      const segments = parrainage.chemin.split('.');
      const cheminParent = segments.slice(0, -1).join('.');
      const parentMembreId = cheminParent ? (cheminVersMembreId.get(cheminParent) ?? null) : null;

      const membre = membreParId.get(parrainage.membreId);
      const niveau = membre ? niveauParId.get(membre.niveauActuelId) : undefined;

      return {
        membreId: parrainage.membreId,
        matricule: membre?.matricule ?? '—',
        niveauId: membre?.niveauActuelId ?? 0,
        niveauNom: niveau?.nom ?? '—',
        parentMembreId,
        profondeur: parrainage.profondeur,
      };
    });
  }
}
