import { Injectable, NotFoundException } from '@nestjs/common';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

/**
 * L'administrateur retire une formation du catalogue, avec son programme.
 * Ce que les membres y ont déjà obtenu (certificats, Coins) leur reste acquis.
 */
@Injectable()
export class SupprimerFormationUseCase {
  constructor(
    private readonly formations: FormationRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly lecons: LeconRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(formationId: string): Promise<void> {
    const formation = await this.formations.trouverParId(formationId);
    if (!formation) {
      throw new NotFoundException('Formation introuvable');
    }
    for (const module of await this.modules.listerParFormationId(formationId)) {
      for (const lecon of await this.lecons.listerParModuleId(module.id!)) {
        await this.lecons.supprimer(lecon.id!);
      }
      await this.modules.supprimer(module.id!);
    }
    await this.formations.supprimer(formationId);

    await this.enregistrerAudit.executer({
      action: 'formation_supprimee',
      typeEntite: 'Formation',
      acteurId: null,
      metadonnees: { formationId, titre: formation.titre },
    });
  }
}
