import { Injectable, NotFoundException } from '@nestjs/common';
import { ModuleFormation } from '../domaine/module-formation';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';

export interface AjouterModuleFormationCommande {
  formationId: string;
  titre: string;
  ordre: number;
}

/** Création de contenu (ModuleFormation) par un administrateur — voir CreerFormationUseCase. */
@Injectable()
export class AjouterModuleFormationUseCase {
  constructor(
    private readonly formations: FormationRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
  ) {}

  async executer(commande: AjouterModuleFormationCommande): Promise<ModuleFormation> {
    const formation = await this.formations.trouverParId(commande.formationId);
    if (!formation) {
      throw new NotFoundException('Formation introuvable');
    }

    const module = ModuleFormation.creer({
      formationId: commande.formationId,
      titre: commande.titre,
      ordre: commande.ordre,
    });
    return this.modules.sauvegarder(module);
  }
}
