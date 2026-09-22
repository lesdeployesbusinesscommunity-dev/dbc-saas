import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleFormation } from '../domaine/module-formation';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { ModuleFormationOrmEntity } from './module-formation.orm-entity';

@Injectable()
export class ModuleFormationPostgresRepository implements ModuleFormationRepositoryPort {
  constructor(
    @InjectRepository(ModuleFormationOrmEntity)
    private readonly repository: Repository<ModuleFormationOrmEntity>,
  ) {}

  async sauvegarder(module: ModuleFormation): Promise<ModuleFormation> {
    const ligne = await this.repository.save({
      id: module.id,
      formationId: module.formationId,
      titre: module.titre,
      ordre: module.ordre,
    });
    return this.versDomaine(ligne);
  }

  async listerParFormationId(formationId: string): Promise<ModuleFormation[]> {
    const lignes = await this.repository.find({ where: { formationId }, order: { ordre: 'ASC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  async trouverParId(id: string): Promise<ModuleFormation | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: ModuleFormationOrmEntity): ModuleFormation {
    return ModuleFormation.depuisPersistance({
      id: ligne.id,
      formationId: ligne.formationId,
      titre: ligne.titre,
      ordre: ligne.ordre,
    });
  }
}
